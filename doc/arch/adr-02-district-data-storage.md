# District Data Storage

## Context

[ADR 01](./adr-01-backend-framework.md) briefly discusses the research and experimentation carried out in order to determine the most efficient methods to perform merging of geographic areas to form new districts. It was determined that using [TopoJSON](https://github.com/topojson/topojson) topologies stored in memory was the leading candidate. This ADR assumes we'll be using TopoJSON and lays out an approach for how we'll go about storing district data given that we'll have access to in-memory topologies to make use of.

One of the open tasks going into this research was to gain experience with TopoJSON's capability of storing multiple geolevels within a single topology, and sharing arc data. Storing the static topology data in such a manner allows us to build districts by mixing and matching geounits in different geolevels, and should lead to large performance gains over building up districts from solely blocks. This is particularly the case in the context of DistrictBuilder where the standard user workflow is to work with larger geolevels while building districts, and to only drop down to the block-level when fine tuning.

In order to test this out, I created a rough script that reads a block-level GeoJSON file and constructs a TopoJSON file with multiple geolevels. The block-level GeoJSON file I tested with was Delaware and only had references to tracts and counties. Note: we will likely be using blockgroups in production rather than tracts, but they are similarly sized, so it shouldn't have a noticeable impact on performance measurements. The script is here: [mk-topojson-hierarchy.js](https://gist.github.com/kshepard/8eaca19d06fa88a25279997a3c4160d7#file-mk-topojson-hierarchy-js).

Another script ([benchmark.js](https://gist.github.com/kshepard/8eaca19d06fa88a25279997a3c4160d7#file-benchmark-js)) was produced to consume this TopoJSON output and randomly create districts in several ways:
 * Using blocks-only to build districts
 * Using tracts-only to build districts
 * Using a combination of blocks and tracts to build districts

After running the script multiple times on my X1 Carbon (4th Gen) laptop, here are some results for constructing 10 districts:
 * Blocks-only: 1500 - 2500 ms
 * Tracts-only: 100 - 200 ms
 * Combination (the number of blocks was gradually increased from none to all):

|Blocks| ms |
|------|----|
|     0| 157|
|  3191| 384|
|  5982| 464|
|  9053| 610|
| 11931| 756|
| 14811|1023|
| 17166|1032|
| 18815|1174|
| 20513|1359|
| 21915|1654|
| 23272|1901|
| 24115|2013|

As expected, these results show that making use of multiple geolevels (as opposed to only blocks) provides significant performance improvements. Also note that the performance scales roughly linearly with the number of merge operations. This is good to know, since it should help to accurately gauge performance when dealing with larger boundaries.


## Decision

There are several considerations to take into account for how to efficiently store this district data:
 * Need to be able to create the data easily on the client-side
 * Need to be able to process the data quickly on the server-side to construct districts
 * The payload for data sent between the client and server should be reasonably-sized
 * Should be able to support a non-fixed set of geolevels, since block/blockgroup/county won't be the only ones available
 * Should minimize the potential for data inconsistencies and invalid states

The data structure I propose for accomplishing this is a tree structure of arrays that is built based on the underlying structure of the topology hierarchy. In this structure, each element is either a district id or an array, and arrays also contain district ids or arrays. For example, consider a configuration where there are 5 counties, each county contains 5 blockgroups, and each blockgroup contains 5 blocks. The initial structure of the districts is: `[0,0,0,0,0]`. This represents the 5 counties assigned to the unassigned district with id 0. If a user were to add the first 2 counties to district 1, it would become `[1,1,0,0,0]`. If a user were then to add the first 2 blockgroups in the third county to district 2, it would become: `[1,1,[2,2,0,0,0],0,0]`. If a user then were to add the first 2 blocks in the third tract of the third county to district 3, it would become: `[1,1,[2,2,[3,3,0,0,0],0,0],0,0]`. The geolevel hierarchy of the specific instance will be specified as part of the instance's configuration in order to be able to determine what each level represents.

It should be straightforward to create districts in such a manner on the client-side. We are planning on loading a large amount of static data on the client-side which will provide access to the topological structure. The prototype code already creates districts in a similar manner via a single array of positional base geounits which reference district ids. The only change here is the additional hierarchy, which is needed in order to support a much larger amount of geounits efficiently (the prototype doesn't support blocks). Likewise on the server-side, we will have access to the topology, and the code in the referenced GIST demonstrates the general way in which this may be accomplished.

The data payloads will be kept compact by relying on the fact that we have knowledge of the positional data. The district ids themselves will never be very large, since instances will only be configured with a limited number of possible districts. And the main use-case, where a user infrequently drops down into the block-level, will keep the payloads especially small until much later in the redistricting process.

This approach also allows flexibility with the configuration of geolevels, since the structure can nest arbitrarily deep depending on how many geolevels are defined, and there is no hardcoding of geolevel-keys. Data inconsistencies and invalid states will be kept low since the structure can be easily validated, and there is no room for having data defined in multiple places (as opposed to an alternative approach where we use an array for each geolevel, which would have these issues).

In terms of actually persisting the data, it is not necessary for PostgreSQL to be aware of the contents, since we won't be running queries on it. We will only need to read the data into a JavaScript object and use TopoJSON to operate on it from that point forward. So we should be able to get away with storing it as a `BYTEA` or similar.


## Consequences

The main consequence of this proposal is that it pushes us further down the path of heavily relying on TopoJSON and therefore JavaScript/TypeScript libraries for performing geospatial operations. This can be considered a bit risky, given that we typically rely on PostgreSQL and Python libraries for doing such work. The up-front research with writing the scripts linked to here, as well as other additional tinkering, is helpful in alleviating these concerns, but we will undoubtedly face some new technical challenges along the way.


## Future work

Storing data in the manner proposed here will likely get us far in terms of efficiency, however there are nice optimizations that we can consider after the fact if we run into performance concerns. The main performance improvement I can imagine is adding a caching layer (likely Redis) where we can store each version of the districts after construction. We can then make use of this when a user makes changes to their districts by reading in the previous version of the districts and then applying only the changes that are requested. This would dramatically cut down on the number of merge operation required, since we will no longer be building up the districts from scratch each time. Related, the client-server payload may be significantly reduced by only sending a diff of what needs to change upon each interaction. These two optimizations may be developed separately, and they don't affect the work being done here, as this base set of logic would still need to be in place as described. I propose that we don't go ahead with these optimizations until the base system is in place, since it may be efficient enough as-is.
