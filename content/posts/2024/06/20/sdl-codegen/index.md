+++
title = 'Typing Schema-first GraphQL Resolvers in TypeScript'
date = 2024-06-20T14:18:32+01:00
authors = ["orta"]
tags = ["changelog"]
theme = "outlook-hayesy-beta"
+++

It was [8 years ago](https://github.com/artsy/metaphysics/pull/282) when I made my first change to a GraphQL API. My next, [_real_ schema change](https://github.com/artsy/metaphysics/pull/412) came along a bit later and looked like this:

```diff
   name: {
       type: GraphQLString,
   },
+  description: {
+     type: GraphQLString,
+  },
   image: Image,
   artists: {
       type: new GraphQLList(Artist.type),
```

We're talking about the early days of GraphQL, and may even have pre-dated the [Schema Definition Language (SDL.)](https://graphql.org/learn/schema/#type-language) This programming environment, now called a "Code first" style of writing a GraphQL API had a bunch of advantages: It was easy to keep in sync (_one language_), write tests for (_just use your app's testing tools_) and scaling your schema required the same sorts of abstractions as the rest of your codebase (_functions and objects please_).

When I started figuring out the tech stack for Puzzmo, I opted [for RedwoodJS](https://redwoodjs.com/) as a base for our API and admin tooling. RedwoodJS out of the box comes with a GraphQL API which uses a "SDL first" style strategy whereby you:

- Write a `*.sdl.ts` file which includes the GraphQL definition for your API
- Write a corresponding 'service/*.ts' file which has functions that map to the SDL declarations

For example, a simplification of the "Puzzle" in Puzzmo looks like this:

```ts
export const schema = gql`
  type Puzzle implements Node {
    id: ID!
    slug: String!

    emoji: String
    name: String
    puzzle: String!

    currentAccountGamePlayed: GamePlayed
  }

  type Query {
    publicPuzzlesSearch(where: JSON!, gameID: String, first: Int, last: Int, before: String, after: String): PuzzleConnection @skipAuth
  }

  type Mutation {
    createPuzzle(input: CreatePuzzleInput!): ErrorablePuzzle! @requireAuth(roles: ["admin"])
  }
`
```

With a corresponding service file like:

```ts
export const Puzzle = {
  currentAccountGamePlayed: (_, { root }) => _getGameplayForCurrentUserOnPuzzle(root.id) 
}

export const publicPuzzlesSearch = async (args) => { /* ... */ } 

export const createPuzzle = async (args) => { /* ... */ }
```

So, "Schema first" means that I am describing all of the GraphQL using the SDL short-hand, then I am filling in the implementations on the GraphQL types. 

What you see above is RedwoodJS doing some special casing here for `Query` and `Mutation` where any top-level function is expected to be on either of those types, and then you can see that I add my own implementation of the Puzzle's `currentAccountGamePlayed`.

This whole system means there's a lot less code, and _I mean a lot_. At my job prior to TypeScript, Artsy, we wrote the [Artsy GraphQL API code-first](https://github.com/artsy/metaphysics/blob/main/src/schema/v2/gene.ts#L55) results in a lot of JavaScript which can be trivially described in SDL, and definitions which often do not need custom resolver logic.

That does not make "Schema first" a magic, easy win though. What I learned over my first year of using RedwoodJS, was that "Schema first" is a lossy abstraction because **it's hard to reconcile the two disparate areas of concern**. E.g. The SDL and the resolvers live in different places.  If you add a new resolver in the SDL, and add a typo to your service file - it could take a long time to discover that.

RedwoodJS's answer for solving this is codegen - relying on the popular [GraphQL Codegen](https://the-guild.dev/graphql/codegen) library/CLI tool to take the schema which you have generated, and creates TypeScript types from it. GraphQL Codegen is a great project, and is very flexible - RedwoodJS have it configured to roughly approximate their runtime implementation and for the sort of people/project's RedwoodJS is targeted at (new startups, probably writing in JS) - it's enough.

As you might have guessed, it was not enough for me.

What were my biggest issues?

- The runtime description was not accurate enough. I'd end up with code which TypeScript is happy with, but crashes at runtime.
- TypeScript error messages in my resolvers very too abstract.
- The generated types lacked nuance, and often included too much information, making it hard to call the resolvers like functions in my tests.


## Introducing SDL Codegen

To folks who know what it means to use [Relay](https://relay.dev/), I describe [SDL-Codegen](https://github.com/puzzmo-com/SDL-Codegen) as Relay-like codegen for GraphQL SDL. At its core, the codegen takes three things into account:

- The SDL definitions
- Prisma as an optional source of truth for the db
- The TS/JS files in your project

I built the core pretty generically, and then built an implementation of a RedwoodJS specific way to describe it's runtime. In theory, other SDL-first projects could re-use this infra, but I'm not interested in doing that work for others. Puzzmo is pretty all-consuming for me. 

So, what are the interesting ideas in SDL-Codegen which make it worth the 1 to 2 hundred hours I put into it?

### Moving all TypeScript computation to Codegen-time

A type like the `const Puzzle` above would look turn into something like this with GraphQL Codegen:

```ts
export type Puzzle = Node & {
  __typename?: 'Puzzle';
  id: Scalars['ID']['output'];
  slug: Scalars['String']['output'];
  emoji?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  puzzle: Scalars['String']['output'];
  currentAccountGamePlayed?: Maybe<GamePlayed>;
};
```

RedwoodJS would add it's own layer of typing on top of that which describes possible resolvers implementations on the Puzzle:

```ts
export type PuzzleResolvers<ContextType = RedwoodGraphQLContext, ParentType extends ResolversParentTypes['Puzzle'] = ResolversParentTypes['Puzzle']> = {
  currentAccountGamePlayed: OptArgsResolverFn<Maybe<ResolversTypes['GamePlayed']>, ParentType, ContextType>;
  emoji: OptArgsResolverFn<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id: OptArgsResolverFn<ResolversTypes['ID'], ParentType, ContextType>;
  name: OptArgsResolverFn<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  puzzle: OptArgsResolverFn<ResolversTypes['String'], ParentType, ContextType>;
  slug: OptArgsResolverFn<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

```

Which... is a lot, and that has me omitting the helper types. In comparison, this is the equivalent types for the `const Puzzle`  

```ts
export interface PuzzleTypeResolvers {
  /** SDL: currentAccountGamePlayed: GamePlayed */
  game: (
    args: undefined,
    obj: { root: PuzzleAsParent; context?: RedwoodGraphQLContext; info?: GraphQLResolveInfo }
  ) => RTGamePlayed | Promise<RTGamePlayed> | (() => Promise<RTGamePlayed>)
}
```

Why so short? 

- SDL-Codegen knows that there's only one resolver implementation in `const Puzzle`, so it omits the rest
- SDL-Codegen also knows that `args` has a `_` prefix and thus unused, so it too, can be omitted
- Both `context` and `info` are also not referenced in the 2nd args, so they get marked as optional

On top of that the lookup work can instead be computed, and resolved to the exact types. This can happen in SDL-Codegen because it knows how to exactly describe Redwood's runtime.

Why is this useful though? There are two key points here:

#### Error Messages are shorter

Have you ever thought hard about how TypeScript's error messages work? [I have](https://gist.github.com/orta/f80db73c6e8211211e3d224a5ab47624). If you'll allow a _gross simplification_ - the most common TypeScript error is that the compiler is trying to look at whether two objects' fields match, and then to show an error message when they don't.

This error message has to describe the full traversal from the point in _code where the disconnect was found_, to the place where the original _description originated_. It's usually a tree traversal _down_ through the structural relationship of the source to a point where it can go _up_ the type relationship of whatever it was assigned to.

So:

```ts
const a = { c: { d: 123} }
let b = { c: { d: "asd" }}

b = a
```

Gives:

```text
Type '{ c: { d: number; }; }' is not assignable to type '{ c: { d: string; }; }'.
  The types of 'c.d' are incompatible between these types.
    Type 'number' is not assignable to type 'string'.(2322)
```

The error message would come while the compile looks at `b = a`, and to describe the error message to you the compiler needs to be able to reliably go back from `d` to the root scope which holds `a`, then back up `b` till we hit `d` again. So: 

```text
a.c.d != b.c.d
```

To get from `a`'s `d` to `b`'s `d` then

```text
d > c > a ~ b > c > d
```

This case is pretty streamlined in the error messaging, and the compiler just shortcuts a full report and says that `c.d` are incompatible.

Now, imagine your resolver has all those levels of re-direction above and TypeScript is comparing:

```ts
export type PuzzleResolvers<ContextType = RedwoodGraphQLContext, ParentType extends ResolversParentTypes['Puzzle'] = ResolversParentTypes['Puzzle']> = {
  currentAccountGamePlayed: OptArgsResolverFn<Maybe<ResolversTypes['GamePlayed']>, ParentType, ContextType>;
}
```

to:

```ts
const Puzzle: PuzzleResolvers = {
    currentAccountGamePlayed: () => ...
}
```

The traversal space necessary for TypeScript to describe why the types are mismatched is massive. That means the error message is gonna get gnarly and tricky to read.

So, all of the work done during codegen to simplify the types means the error description traversal is much shorter.

#### Incentivising writing those damn tests

Look, I like tests, I even wrote a little book on ["Pragmatic iOS Testing"](https://github.com/orta/pragmatic-testing) back in 2016 but if writing a test is not easy and fast (and better experience than hitting refresh a few times) - I'm not gonna be writing tests at this phase of Puzzmo's development. We're too small, Puzzmo has only been live for like 8 months, lots of change ahead still!

In order to test these resolvers, I often made a lib version of the exact same function with a smaller type definition so I didn't need to slather my tests with `any`s. Now, the resolvers are simple to call directly inside the codebase in the test suite, and TypeScript can reliably tell me if I break something.

### Prisma input -> GraphQL output

Resolvers are given the most _exacting input_, and allow for the most _liberal output_. For example, the resolver for `currentAccountGamePlayed` would be defined to have a Prisma type of a Puzzle as the argument `root` but you can return any sort of object which conforms to the `GamePlayed` type from the GraphQL schema.

If you are the sort of person who treats GraphQL as a ["view model"](https://artsy.github.io/blog/2016/06/19/graphql-for-mobile/#view-models) layer, this very useful because you can return all sorts of useful _derived_ data about your current type and know that it is correctly getting type-checked via the return position of the types in the SDL.

### ESLint auto-fixes

Typing your types, yawn. As there's only one possible way to set up your types with SDL-Codegen then the entire thing can be automated away and you never need to remember the name of the imports or types. 

Pressing save (with the auto-fixer turn on) changes this:

```ts
export const Puzzle = {
  currentAccountGamePlayed: (_, { root }) => _getGameplayForCurrentUserOnPuzzle(root.id) 
}

export const publicPuzzlesSearch = async (args) => { /* ... */ } 

export const createPuzzle = async (args) => { /* ... */ }
```

To this:


```ts
import { PuzzleTypeResolvers, CreatePuzzleResolver, PublicPuzzlesSearchResolver } from "types/puzzles"

export const Puzzle: PuzzleTypeResolvers = {
  currentAccountGamePlayed: (_, { root }) => _getGameplayForCurrentUserOnPuzzle(root.id) 
}

export const publicPuzzlesSearch: PublicPuzzlesSearchResolver = async (args) => { /* ... */ } 

export const createPuzzle: CreatePuzzleResolver = async (args) => { /* ... */ }
```

Each service file has a corresponding type definition, so we can make safe assumptions about the lookup. 

### Extending the resolver input

The above is all good and proper, but actually doesn't fully describe how objects are passed through a GraphQL operation. One way in which I try to keep performance reasonable in our API is though making as few database round-trips as possible. This means that in the `currentAccountGamePlayed` resolver, the input object may have _already_ looked up the user's gameplay (because then it could be batched with other puzzles.)

This can't easily be represented at SDL level, and so instead SDL-Codegen looks to see if you have declared the `const Puzzles` as being a generic type instead.

So, normally it would look like:

```ts
const Puzzle: PuzzleResolvers = {
   currentAccountGamePlayed: () => ...
}
```

But if you wrote:

```ts
const Puzzle: PuzzleResolvers<{ existingGameplay?: GamePlay }> = {
   currentAccountGamePlayed: () => ...
}
```

Then all of the resolvers would be able to check if `root.existingGameplay` existed before making a db round-trip.  

### File-based Type Separation

Because the source of truth for these resolvers is the service file where they implement the resolvers, SDL Codegen generates a type file per service file. This means each file is smaller and easier to understand at a glance. 

There is also two separate 'whole-schema' style definition files which are generated along-side the service files. One for resolver inputs and one for resolver outputs. These are very useful for referencing those when passing the same arguments around your codebase.  

### Linting Service Files

If you know all of the schema, and all of the resolver implementations - then it's pretty easy to know whether a resolver is implementing something which isn't defined in the schema! SDL Codegen will let you know about orphaned implementations.

### Fast

There's not that much work going on, and it's built for one specific task - SDL-Codegen is practically instant.

## 1.0'd

I gave SDL Codegen the 1.0 release when I started writing this post. It's been used in Puzzmo now for ~1.5 years, and has been [available in RedwoodJS](https://docs.redwoodjs.com/docs/typescript/generated-types/#experimental-sdl-code-generation) as an option for your API codegen for about 6 months of that. So, it's probably pretty production ready!