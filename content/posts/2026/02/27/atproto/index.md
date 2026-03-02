+++
title = 'Wrangling atproto + Bluesky for Puzzmo.com'
date = 2026-02-27T00:42:01Z
authors = ["orta"]
tags = ["tech", "atproto"]
theme = "puzzmo-light"
+++

## Catch-up

If you want the end-user perspective of what we have shipped read: [Bluesky on Puzzmo](../bsky). The TLDR:

- We have Bluesky follower sync
- We have a labeler which sets labels so you can see other Puzzmonauts on Bluesky
- We store your steak data in your Bluesky account
- We post the Cross|word midi dailies to our Bluesky account

But getting to this feature set was not a linear path and I think it's interesting to both cover the autobiographical reasons for why these exist, and the technical foundations so that more folks can consider what it means to interact with the Atmosphere.

## Terminology

If you are familiar with atproto development, you're welcome to skip this. I am going to give you a quick summary of what it means to work with atproto so I can stop using more ambiguous terminology and start throwing jargon around.

If you have 20m to spare, and truly want to grok it read this: [A Social Filesystem](https://overreacted.io/a-social-filesystem/) which was what fully nailed it to me. I will give a few paragraphs to explain what's necessary for this blog post.

When you sign up to Bluesky, you are creating an [atproto](https://atproto.com/) account. An atproto account is a wrapper of a cryptographical identity and a collection of typed JSON blobs (records) called a registry. The 'identity' here is a [DID](https://atproto.com/specs/did) (Decentralized IDentifier) which you can think of as a network-unique ID to users/files/content/etc, mine is [`did:plc:t732otzqvkch7zz5d37537ry`](https://pdsls.dev/at://did:plc:t732otzqvkch7zz5d37537ry). It looks, and acts like a URL does for HTTP.

Atproto is a protocol, [made for creating decentralized social applications](https://atproto.com/articles/atproto-ethos).

Bluesky is effectively the reference atproto app, testing and pushing the protocol with real-world constraints while acting as a way to get people interested. If people use Bluesky, then they already have an atproto account so that the next atproto apps are easier to bootstrap and interop with.

In an atproto account's registry, a user has 'collections' which are JSON blobs that have the same type. So, when I post to Bluesky, it is a JSON blob in the collection [`'app.bsky.feed.post'`](https://pdsls.dev/at://did:plc:t732otzqvkch7zz5d37537ry/app.bsky.feed.post). Any client can get access to the firehose of changes (the Jetstream) to JSON blobs for every atproto account. It's also possible to backfill that data, which to my knowledge, is quite the achievement.

So, to make an app like Bluesky, you would listen for all change to `app.bsky.feed.post`s and then do something clever with the realtime data. A lot of bluesky labelers listen to _all likes_ across the network to determine if a specific post was liked, and if so apply a label to that user.

So above, when I say _"We store your steak data in your Bluesky account,"_ I really mean: _"We post a Streak JSON blob to the com.puzzmo.streak collection on your atproto account's registry."_ It was an acceptable fudging we can now move past.

## 14 Months Ago

I wasn't wild on trying Bluesky.

I had been talking to Brooke, who said that the Crossword community had started to converge on Bluesky, and at the same time some of the developers who had been making the Mastodon web client [Elk](https://elk.zone/) had started to dabble in Bluesky.

I felt very culturally aligned to Mastodon, I'm a Linux guy who doesn't like algorithms influencing what I see. I enjoy not using tech and products from mega-corps. My mastodon account runs on a small server hosted by friends ([webtoo.ls](https://webtoo.ls)) and I still have a deep sense of loss from what happened to Twitter in the 2020s. Moving to a new American, VC-backed social network was really not something I had active interest in.

I spent quite a lot of time building prototypes of Puzzmo with integrations for ActivityPub (what powers Mastodon), but I just couldn't find a good place to start in terms of features that people would actually want. We could automatically post to people's feeds but that's uninteresting, we auto-post images of our dailies, which is also pretty uninspiring. At best, all I could think of were things which I would never engage with. So, they didn't even get sent to the team, let alone the public.

But, people I like moved over to Bluesky, and I didn't have to have an algorithmic feed in their app. I could concede and give it a shot.

## 11 Months Ago

I was looking at adding my pronouns to my Bluesky account, and was reminded of how this system echo'd a Nintendo feature called [StreetPass](https://www.nintendo.com/en-gb/Hardware/Nintendo-3DS-Family/StreetPass/What-is-StreetPass-/What-is-StreetPass-827701.html) which has your Nintendo 3DS track other 3DSes which pass each other in the street.

What if we could have the serendipity of StreetPass, but while you were browsing Bluesky? I know we have quite a few micro celebrities using Puzzmo and I would be interested in seeing how they do on Puzzmo.

Having built out Twitch Oauth to Puzzmo a month or two earlier, for an unreleased feature (I think I have a technique for hooking up whether someone was streaming a game on Puzzmo) I
figured we might have an interesting prototype for a Bluesky integration.

So, where do you start with this?

I took the [Bluesky Labeler starter kit](https://github.com/aliceisjustplaying/labeler-starter-kit-bsky) for a ride and made it so you could like a post to apply a 'Puzzmonaut' label and showed it to the team with the framing of: _"What if we let people sign up to their Bluesky account and we set the label for them"_. I got an "that's interesting", but not much more interesting than other ideas.

Labelers are an interesting system. You take an atproto account and you "change" it into a labeler by posting a record to a specific collection (`'app.bsky.labeler.service'`) on their registry. Here's ours: [puzzmo-labeler.bsky.social](https://pdsls.dev/at://did:plc:4p3ilpfcl77fqgoofjmghznc/app.bsky.labeler.service/self) - it is still a normal account by other means but you declare ahead of time all the possible labels.

( So, if you wanted to make an app which tracks all labelers, you'd listen to the Jetstream for all `app.bsky.labeler.service` records being created/removed. )

### Bluesky Oauth

Building Oauth login for Bluesky is a bit different than building a normal OAuth client because it is decentralized. Typically, you would go to the Oauth provider's site and register your application to get a secret and an ID. The Bluesky Oath system doesn't work that way, instead you have two publicly accessible endpoints:

- Oauth config: https://api.puzzmo.com/blueskyApp
- JWK public keys: https://api.puzzmo.com/atProtoJWKs

A JWK (JSON Web Key) was a new concept for me then, it's a JSON object with known keys describing a cryptographic key. It has both public and private key variants.

With those two endpoints up and running, I used [@atproto/oauth-client-node](https://npmx.dev/package/@atproto/oauth-client-node) to handle the server back-and-forth, did some db work to our existing fastify/prisma setup and got to a point where we were able to log in a user, get their profile and set their avatar image and display name.

It was good enough to make into a feature flag and keep around, but not good enough to inspire anyone to care to do the work to make it shippable.

## 4 Months Ago

I start to find myself at the beginning of a multi-month slump, just sorta generally uninspired.

## 2 Months Ago

I opt to start focusing on Puzzmo.com, after a year of exclusively doing B2B style work behind the scenes.

To get started on that, I went through every source of feedback (internal and external) we've ever had and [pulled](signal-2026-01-07-044803.jpeg) [out](signal-2026-01-07-044801.jpeg) [all](signal-2026-01-07-044801_002.jpeg) of the features folks have asked for and put them on a whiteboard. After sitting with Craig, Zach and Andrew for a few hours, it looked like one of the big blockers for many ideas was '[Follows not Friends](https://blog.puzzmo.com/posts/2026/02/06/follows-not-friends/)', something Zach has been asking about for a year or so.

So, I got started on that.

## 1 Months Ago

I'm very grateful that Dan Abramov took a third stab at trying to find the right metaphors to describe how atproto works with this post:

{{< bluesky uri="at://did:plc:fpruhuo22xkm5o7ttr2ktxdo/app.bsky.feed.post/3mcoktonamk2m" cid="bafyreibsegn5z22rhxoyu2ctv6yar36lrpsuwb2lkm6sngvfgmglbtfzei" >}}

It really clicks with me.

I thought to myself, rather than mulling over something I want to avoid thinking about, maybe I should just throw myself into a completely new technical context. I wasn't interested in learning a new programming language, but trying to think about building apps using in a de-centralized file-based system? There could be something there.

Off the bat from that one article, I came out with a bunch of ideas:

- ![A screenshot of the blog post](Screenshot_2026-02-27_11-42-34.png)
  If it was possible to jump across contexts like this, it would be interesting to be able to show Puzzmo user data like profile stats and streaks.

- ![A screenshot of the blog post](Screenshot_2026-02-27_19-27-41.png)
  If any app can edit any record, then there needs to be a way to prove a record was made by someone!

But also, if I'm in the process of converting Puzzmo to a follower style relationship model, then maybe I can break out that old prototype and add Bluesky follower syncing as the headline feature.

Then a week later I woke up and couldn't get this idea out of my head:

![A message saying 'Keybase, but for atproto'](Screenshot_2026-02-27_19-31-14.png)

Maybe I could fill that void by working on a tricky atproto app, learn enough to be able to come back to Puzzmo and really nail Bluesky support.

## 3 Weeks Ago

I spend a weekend [researching and making](https://github.com/orta/keytrace/blob/eb784e3ef2d2b57bc8c6213c41b444babee40b79/keytrace-plan.md) a rough version of a Keytrace. If you never used Keybase, it was a startup which took the concept of PGP [keyservers](https://en.wikipedia.org/wiki/Key_server_(cryptographic)) and made them approachable and modern. Once Keybase had your keys set up, the site made it possible for you to be able to hook up other internet accounts to your Keybase as a  [web of trust](https://en.wikipedia.org/wiki/Web_of_trust) system.

So, 12 years ago I made [this gist](https://gist.github.com/orta/9589737):

````
### Keybase proof

I hereby claim:

  * I am orta on github.
  * I am orta (https://keybase.io/orta) on keybase.
  * I have a public key whose fingerprint is E91F 36B1 5554 2702 F46E  E083 9F5E 5653 EE2A C266

To claim this, I am signing this object:

```json
{
    "body": {
        "key": {
            "fingerprint": "e91f36b155542702f46ee0839f5e5653ee2ac266",
            "host": "keybase.io",
            "key_id": "9F5E5653EE2AC266",
            "uid": "e7369ce59bbd707c2bd1fe55f1f73100",
            "username": "orta"
        },
        "service": {
            "name": "github",
            "username": "orta"
        },
        "type": "web_service_binding",
        "version": 1
    },
    "ctime": 1395003014,
    "expire_in": 157680000,
    "prev": null,
    "seqno": 1,
    "tag": "signature"
}
```

with the PGP key whose fingerprint is
[E91F 36B1 5554 2702 F46E  E083 9F5E 5653 EE2A C266](https://keybase.io/orta)
(captured above as `body.key.fingerprint`), yielding the PGP signature:

[...]
````

The Gist's content connects my ["orta"](https://github.com/orta) GitHub account, to my ["orta"](https://keybase.io/orta) Keybase account - only my account can post a gist to my account too! The gist does this by including a proof of identity message which is signed by my PGP key which is attached to my Keybase account. Now, what is interesting with Keybase's approach, and why it's still brought up in many modern contexts is that everything is publicly verifiable. Keybase could trivially have added GitHub Oauth to their site and then privately they can prove that you have logged into another account. However by forcing the full verification process to be done in the public anyone can check, and Keybase itself would occasionally re-checks on a schedule.

Now, Keybase had a bit of a fatal flaw in that it was a real company, and that company got [sold to Zoom](https://www.zoom.com/en/blog/zoom-acquires-keybase-and-announces-goal-of-developing-the-most-broadly-used-enterprise-end-to-end-encryption-offering/) amidst the pandemic lockdowns. I'm sure it was hard to figure out how to get folks paying for Keybase, and credit to the team that the website is still up and running, and even the client [seems to still get updates](https://github.com/keybase/client/graphs/contributors).

Keybase's identity coalescing is a great example of the type of problem atproto is trying to solve. If you can separate the data from the application, then if I decide to stop doing work on Keytrace, someone else can just continue with the same data.

Keytrace did have to solve one a different problem: data provenance. If any app can write/edit anything to a users registry... Then anyone can say they are anyone else! That's a bit of a blocker. I knew this was going to be an issue with Puzzmo too, if we want to present ourselves as 'putting your data on your registry', we should be able to prove that it is from us!

Typically if you want to prove something, you sign in, but Keytrace can't manipulate the envelope of a record in a registry. There aren't APIs for that, instead we use an inline signing system. As an example, here is the record of my claim to own the GitHub handle "orta" in [my atproto registry](https://pdsls.dev/at://did:plc:t732otzqvkch7zz5d37537ry/dev.keytrace.claim/3mfjc5hvxkz24):

```json
{
  "sigs": [
    {
      "kid": "attest:github",
      "src": "at://did:plc:hcwfdlmprcc335oixyfsw7u3/dev.keytrace.serverPublicKey/2026-02-23",
      "signedAt": "2026-02-23T09:02:11.550Z",
      "attestation": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGFpbVVyaSI6Imh0dHBzOi8vZ2lzdC5naXRodWIuY29tL29ydGEvYjdkY2NkZmIwOGU3ZmJiODU1MzM3YTQ0NGI2MmUyZDMiLCJjcmVhdGVkQXQiOiIyMDI2LTAyLTIzVDA5OjAyOjExLjU1MFoiLCJkaWQiOiJkaWQ6cGxjOnQ3MzJvdHpxdmtjaDd6ejVkMzc1MzdyeSIsImlkZW50aXR5LnN1YmplY3QiOiJvcnRhIiwidHlwZSI6ImdpdGh1YiJ9.Vv566U9wMlqP2ygwme_XwFvyCHChEmremY5x30gwBCdSBRvqpVOvNK_VppxwbMYV3wpvnBofufw2HHlVlJayWg",
      "signedFields": [
        "claimUri",
        "createdAt",
        "did",
        "identity.subject",
        "type"
      ]
    },
    {
      "kid": "status",
      "src": "at://did:plc:hcwfdlmprcc335oixyfsw7u3/dev.keytrace.serverPublicKey/2026-02-28",
      "signedAt": "2026-02-28T21:51:56.657Z",
      "attestation": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGFpbVVyaSI6Imh0dHBzOi8vZ2lzdC5naXRodWIuY29tL29ydGEvYjdkY2NkZmIwOGU3ZmJiODU1MzM3YTQ0NGI2MmUyZDMiLCJkaWQiOiJkaWQ6cGxjOnQ3MzJvdHpxdmtjaDd6ejVkMzc1MzdyeSIsImxhc3RWZXJpZmllZEF0IjoiMjAyNi0wMi0yOFQyMTo1MTo1Ni42NTdaIiwic3RhdHVzIjoidmVyaWZpZWQifQ.bkarHo_BDVmMv7asuqxj8u9JbfESzWfBuJrX4sBvP07WE5ZmQTsKUo50dJBE51IXpaP5D1nThsknScXHtx4l3w",
      "signedFields": [
        "claimUri",
        "did",
        "lastVerifiedAt",
        "status"
      ]
    }
  ],
  "type": "github",
  "$type": "dev.keytrace.claim",
  "status": "verified",
  "claimUri": "https://gist.github.com/orta/b7dccdfb08e7fbb855337a444b62e2d3",
  "identity": {
    "subject": "orta",
    "avatarUrl": "https://avatars.githubusercontent.com/u/49038?v=4",
    "profileUrl": "https://github.com/orta"
  },
  "createdAt": "2026-02-23T09:02:12.733Z",
  "prerelease": true,
  "lastVerifiedAt": "2026-02-28T21:51:56.657Z"
}
```

There are two different signatures inside the JSON blob, each are a signed by the Keytrace server and describe which fields have been marked as being attested.

- Signature: `attest:github` proves the claimed URL, the creation date, the owner of the registry, the claimed identity and the type as being verified by the Keytrace server on 2026-02-23
- Signature: `status` proves the claimed URL, the owner of the registry, the verification date, and the result of the verification as being done by the Keytrace server on 2026-02-28

So, it's a mutable "untrustworthy" record, but we have subsets which have been signed by the server. The keys are linked as atproto DIDs, e.g. [`"at://did:plc:hcwfdlmprcc335oixyfsw7u3/dev.keytrace.serverPublicKey/2026-02-23"`](https://pdsls.dev/at://did:plc:hcwfdlmprcc335oixyfsw7u3/dev.keytrace.serverPublicKey/2026-02-23) where you can grab the public key if you want to verify the signature yourself.

If you want to see the process step-by-step, put 'orta.io' in https://keytrace.dev/developers

So, with data verification at a reasonable spot and having got a deeper understanding of atproto. It's time to come back to Puzzmo.

## 2 Weeks Ago

I have just wrapped up the final polish pass on the Followers, and its time to look at Bluesky follower sync. The concept itself is not too tricky, 