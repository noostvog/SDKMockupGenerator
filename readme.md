#ServerMockupGenerator
*ServerMockupGenerator* is a project thats generates a SDK mock-up of an API, given an OpenAPI specification file.
For every entry point listed in the specification file, *ServerMockupGenerator* generates a corresponding function.
This mockup can be used as a start to implement the server, an SDK of the server or simply as a mock-up used on the client-side.

In the API specification file, custom definitions can be used to specify constraints between parameters, such as: "either the user ID or the screen name should be used to identify a Twitter user".
The generated code is written in TypeScriptIPC ([GitHub page](https://github.com/noostvog/TypeScriptIPC)), an extension of TypeScript with a new kind of interface definition that allows presence constraints _between_ properties.
This enables the translation of the inter-property constraints from the OpenAPI specification file to the interface definitions in TypeScriptIPC.

By translating constraints from the specification to interfaces, this tool ensures statically that the data for an entry point adheres to the constraints defined in the specification: *ServerMockupGenerator* generates an interface that contains the constraints for each every point, and requires that the arguments of the corresponding function are of that interface type.

## How to use ServerMockupGenerator
First, import the *ServerMockupGenerator* tool, as well as the OpenAPI specification file you want to use.
```
var generator = require('./src/api_generation.js');
var twitter = require('./api_definitions/twitter_small.json');
```

Second, add the OpenAPI specification file to the generator using `addDefinition`.

```
generator.addDefinition(twitter);
```

Finally, use the `generate` function to generate a mock-up file for the given API specification. This function expects one parameter to indicate the filename for the mockup. 
```
generator.generate("twittermock.ts");
```

## Example of result
```
export module Twitter{
  export interface PostDirectmessagesnew {
    user_id?: number;
    screen_name?: string;
    text?: string;
  } constrains {
    present(text);
    or(and(present(user_id),
           not(present(screen_name))),
       and(not(present(user_id)),
               present(screen_name)));
  }
  export function postDirectmessagesnew(body: PostDirectmessagesnew){
    // your implementation here
  }
  export interface PostStatusesupdate {
    status?: string;
    in_reply_to_status_id?: number;
    possibly_sensitive?: string;
    lat?: string;
    long?: string;
    place_id?: number;
    display_coordinates?: string;
    trim_user?: string;
    media_ids?: string;
  } constrains {
    present(status);
    and(implic(present(lat),present(long)),
        implic(present(long),present(lat)));
  }
  export function postStatusesupdate(body: PostStatusesupdate){
    // your implementation here
  }
  export interface PostListmemberscreate {
    list_id?: number;
    slug?: string;
    screen_name?: string;
    user_id?: number;
    owner_screen_name?: string;
    owner_id?: number;
  } constrains {
    or(and(present(slug),
           not(present(list_id))),
       and(not(present(slug)),
           present(list_id)));
    or(and(present(user_id),
           not(present(screen_name))),
       and(not(present(user_id)),
           present(screen_name)));
    implic(present(slug),
           or(and(present(owner_screen_name),
                  not(present(owner_id))),
              and(not(present(owner_screen_name)),
                  present(owner_id))));
    implic(present(owner_screen_name),
           present(slug));
    implic(present(owner_id),
           present(slug));
  }
  export function postListmemberscreate(body: PostListmemberscreate){
    // your implementation here
  }
}
```