//Server Stubs
export module Twitter{
export interface PostDirectmessagesnew {
user_id?: number;
screen_name?: string;
text?: string;
} constrains {
present(text);
or(and(present(user_id),not(present(screen_name))),and(not(present(user_id)),present(screen_name)));
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
and(implic(present(lat),present(long)),implic(present(long),present(lat)));
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
or(and(present(slug),not(present(list_id))),and(not(present(slug)),present(list_id)));
or(and(present(user_id),not(present(screen_name))),and(not(present(user_id)),present(screen_name)));
implic(present(slug),or(and(present(owner_screen_name),not(present(owner_id))),and(not(present(owner_screen_name)),present(owner_id))));
implic(present(owner_screen_name),present(slug));
implic(present(owner_id),present(slug));
}
export function postListmemberscreate(body: PostListmemberscreate){
 // your implementation here
}

}
