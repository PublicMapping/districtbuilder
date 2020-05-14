Backend Framework
==================

Context
-------

DistrictBuilder is intended to be a primarily front-end application, with a back-end API to persist data and support operations that cannot be feasibly completed in the browser in a performant manner.

The main performance critical operation we know the back-end API will need to support is the merging of geographic areas to form new districts. Through some [research and experimentation](https://docs.google.com/document/d/1znHcDr1wXQ1vr6cNiI5Y9gl5uwIveVPj659Wpug70Is/edit?usp=sharing), we have decided to rely upon [TopoJSON](https://github.com/topojson/topojson) to support this operation.

TopoJSON is written in JavaScript (there are TopoJSON libraries in other languages, but none support the critical merge operations that make TopoJSON useful for our situation), and in order to be able to use it in a performant manner we must create a Node.js service that can keep the TopoJSON data structure in-memory. Due to familiarity and enthusiasm from the team, we would prefer to use TypeScript for this service over plain JavaScript.

As an additional point in favor of Node.js / TypeScript, using TypeScript will enable us to share code with the frontend, which will be particularly helpful as we expect to need to mirror some client-side operations on the backend to support contest submissions validation.

In addition to being able to perform TopoJSON operations, the back-end API will need to be able to provide user authentication (and potentially user registration and management as well) and communicate with a PostgreSQL database to persist data.

I evaluated [11 different Node.js web frameworks](https://docs.google.com/spreadsheets/d/1zLixcL1Xt53iYPkvzDHidg48uyKrevO7i7zj6EiBMBA/edit?usp=sharing), which generally fell into 3 types:

- Minimalist, generally with only routing and minimal HTTP support. Other features are potentially available as middleware.
   - Express
   - koa
   - hapi
   - Fastify
   - Next
 - Fully featured, with support for user authorization & registration, an ORM, database migrations, etc. Typically built *using* one of the more minimalist frameworks under the hood.
   - Adonis
   - Feathers
   - Nest
   - Meteor
 - Somewhere in-between, with some extra features built-in, and others only as third-party plugins.
   - Sails
   - Loopback


From these frameworks, I immediately identified a few that won't work well for our purposes:
 - MeteorJS is a popular and well-documented framework, but it only supports MongoDB for persisting data
 - Next is primarily focused on server-side rendering of React applications, and does not provide many of the features we would need, nor does it have a large third-party plugin ecosystem to make up for the lack of first-party support.


For the more minimalist frameworks, there are third-party tools we could leverage to make up for missing features.

User registration:
 - Auth0 can provide this as an external service, and is a service we are familiar with
 - [Passport](http://www.passportjs.org/docs/)

Database querying & migrations management
 - [TypeORM](https://typeorm.io/#/), TypeScript first ORM with support for generating migrations
 - [Sequelize](https://sequelize.org/) more dynamic Javascript-focused ORM, supports migrations but can't generate them
 - For a more low-level approach, `node-postgres` or KnexJS combined with `node-db-migrate`


The more "batteries-included" frameworks tend to use the above libraries (in some cases even allowing swapping in one with another), rather than including their own implementations. This means that when choosing between one of these frameworks or a more minimalist one like Express, what we are really choosing between for the most part is whether to put the pieces together ourselves or whether to use the combination of libraries brought together by a framework like Nest or Feathers.


We could also instead consider using a minimalist framework in a hybrid approach, where we build most of the back-end API in a language/framework we are familiar with, such as Python & Django, and encapsulate the TopoJSON-specific operations in a microservice. This would allow us to not need to learn a new way of managing database migrations, user authentication or management, etc., but with a cost of greater architectural complexity and a potential performance loss due to communication overheads. For such an approach I think it would make sense to go with Express, as we have familiarity with using it for other microservices on previous projects.


Decision
--------

We will proceed by using TypeScript with Nest as the framework for the DistrictBuilder backend API.

The documentation for Nest was among the best of the frameworks I investigated, and the [purposeful similarity to Angular](https://codesandbox.io/s/jjo90y00xw?from-embed) will hopefully provide an easier learning curve given the familiarity within the development team with Angular.

By using Nest we won't have to choose a user authentication strategy (it provides an integration with Passport) or database management library (it uses TypeORM by default). Because it is built on-top of Express we can still use Express-middleware if necessary, but we may not have to as there are a number of plugins (https://github.com/juliandavidmr/awesome-nestjs#components--libraries). Nest also provides a dependency injection framework, which is an added bonus.

---

Feathers was another major contender, and it provides many of the basics we need. Ultimately the choice between them mainly came down to Nest appearing to have better TypeScript support, and the familiarity of the Angular-esque application structure used by Nest.

Adonis is seemingly less popular and well-known than either Feathers or Nest, though it did seem to offer a similar feature-set to Nest.

The hybrid/microservice approach was compelling, but the added architectural complexity is significant, and I don't think our back-end needs really require a framework as complex and all-encompassing as Django, Additionally, the ability to write the backend in a statically-typed language like TypeScript is attractive, which we would be mainly giving up with a microservice-based approach.


Consequences
------------

By making the decision to build the entire back-end using Node.js, we're taking an approach that hasn't been commonly used at Azavea, where we have typically used a microservice approach when making use of Node.js libraries (such as when using Windshaft for tiling).

The consequences of this decision are primarily in increased time spent learning the new framework. Additionally, by using Node.js instead of a platform we're more familiar with like Python or Scala we'll inevitably encounter situations that require research into how to do things that would be solved by familiar and well-known tools on a platform we're more familiar with.

By choosing to use Nest, we are hopefully reducing the need for further research and decision-making, by providing a default choice for the libraries that we would inevitably need to integrate if we used Express and mix/matched other libraries to match the feature set provided by Nest.
