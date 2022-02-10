# Server concurrency strategy

## Context

CPU intensive work on the main event thread is hurting our performance and causing our health-checks to fail. Because Node is single-threaded by default, CPU intensive work on the main thread blocks us from responding to other requests.

There is an exploratory branch here [`c214bac6`](https://github.com/PublicMapping/districtbuilder/commit/c214bac64111615e7a213972d512a7d765c68821) that does some initial work at moving the TopoJSON merge operation off of the main thread - it's likely that we'll also want to move imports & exports as well - but this is still unacceptably slow for large regions due to the need to `deserialize` the topojson data for each merge operation.

The Node.js memory model prevents us from directly sharing the TopoJSON object as-is between threads or processes - for the most part Node uses an actor model, using message passing to copy data w/o directly sharing memory.

Node does have two exceptions to this: `ArrayBuffer` can be _transferred_ between threads instead of copied, and `SharedArrayBuffer` can be used on multiple threads at once - but both of these can only be used to store typed numeric arrays - not generic objects.

### Options considered

#### Improve deserialization on-demand performance further

The threading strategy pursued in [`c214bac6`](https://github.com/PublicMapping/districtbuilder/commit/c214bac64111615e7a213972d512a7d765c68821) involved keeping the binary serialized data in a `SharedArrayBuffer`, and deserializing it in the worker for each request.

I did some benchmarking on some of our largest regions using the current `v8.deserialize` method, which showed that deserializing the PA LRC or the TX regions (which are the two largest) took about 6-9 seconds on average.

I attempted to swap `v8` for Protobuf by using `geobuf` version `1.0.1`, which was the last version to support TopoJSON, but saw no significant difference in performance [`c90a760`](https://github.com/PublicMapping/districtbuilder/commit/c90a7602a440c1aea035b8ec676cdc71b15ef086). I _did_ however note a significant size reduction, so we should seriously consider switching to using Protobuffer as part of #1117

I also tried using [`mmap-object`](https://github.com/allenluce/mmap-object) but that caused a performance decline relative to just using `v8` serialization.

#### Fork the TopoJSON library / merge algorithm to store data in SharedArrayBuffer

I did some basic work towards this, but I think we would need to _radically_ rework how the topojson merge operation works and how the format is stored for this to be worthwhile. My experiments involved swapping out the `arcs` array in `Topology` for an [`ndarray`](https://www.npmjs.com/package/ndarray) backed by a `SharedArrayBuffer`, which was *worse* performance-wise than the `v8` (de)serialize route, including attempts to go further by doing the same to the `arcs` array for each feature.

My guess here is that transferring hundreds of thousands of `SharedArrayBuffer` objects is still pretty slow, so the only way to really push this further would be a radical restructuring of the entire way we access the GeometryCollection to store data as a struct-of-arrays, which would limit the number of `SharedArrayBuffer` to a fixed amount determined by the number of fields.

#### Rewrite the CPU intensive tasks in C++

I think this is a viable option. Node.JS has good bindings for C++, and C++ is not subject to the constraints of the Node.JS memory-model - we could easily share the read-only Topology data between threads.

The downsides here are significant though - we'd have to not just rewrite the TopoJSON `mergeArcs` method, but also all of our own business logic that uses TopoJSON data: the district merge operation and project import and export. This is a significant amount of code to rewrite, and while there is a working test harness we don't have many tests - we'd need to write a much more significant test suite tested against the current codebase to feel confident the rewrite was implemented correctly.

We also don't have any real C++ expertise on the team, so we would either need to use off-team resources to build and maintain this part of the codebase, or expect a significant amount of training and learning to be required beforehand.

#### Cache data load in worker threads

For this approach we keep the buffer data available on the main thread and deserialize it as needed, like in the first approach, but we also add an LRU cache in each worker thread. This allows us to skip the deserialization performance penalty after the first request, and setting the `maxSize` parameter on the LRU cache ensures that we don't exceed the memory limits of the system. I made a test branch here [`09df46a5`](https://github.com/PublicMapping/districtbuilder/commit/09df46a50f9ec54cc6e0af8a26fd3ce30302172c) that showed acceptable speeds and I believe there is room for further potential improvements in data caching.

We can route requests to worker threads that already have the data loaded, or to another worker if those are busy, allowing for a degree of concurrency.

The main downsides here are that we're being a bit duplicative (data in both serialized and deserialized formats, data potentially duplicated between threads) with the data we keep around, which could increase our memory requirements. We also go from having our largest datasets being mostly static, to instead constantly serializing and deserializing as we change what data is cached in which worker threads - which has a potential to change the runtime behavior of the application in unexpected ways.

This option becomes much more attractive if we can reduce the time spent loading the loading the buffer (see #1117) to under a few seconds, as we could also load the buffer in the worker thread before caching the deserialized data in that case and not need the memory requirements of keeping the deserialized files around in memory on the main thread.

#### Load data in worker threads

A variation of above keeping data cached in worker threads, but instead of loading the binary data on the main thread we would instead load data directly in each worker thread, with each thread loading a subset of states.

This is conceptually simpler than the caching approach, ensuring the memory footprint of our large datasets stays static and predictable, and avoids the potential of a cache-hit causing a request to be slower, but it limits our concurrency potential; by having only one thread capable of handling any given region, any concurrent requests from other users would have to block.

## Decision

We'll use the caching approach outlined above as option four.

This should be relatively quick to implement, and allow for some degree of concurrent data processing for the same state.
We should evaluate our options for improving file loading performance, and consider whether we can skip the initialization step where we load and cache the binary data, but regardless of that we'll still use an LRU cache in each worker thread.

Switching to a PBF format as part of this would be prudent if we need to keep the pre-caching, as that seemed to reduce the binary size by about 50%. Doing this would require maintaining our own protobuffer bindings for TopoJSON - we could fork `geobuf` version `1.0.1` for this, which was the last version that supported TopoJSON.

## Consequences

We'll need to carefully monitor application performance after making this change, as it will likely affect our steady-state memory usage - and consequently we should probably wait to reduce our instance size until after we make this change, which we should instead defer until a later release.

Long-term the C++ approach might be better for the best-possible performance, but sticking to an entirely Node.JS backend seems worthwhile in terms of long-term maintenance and support.
