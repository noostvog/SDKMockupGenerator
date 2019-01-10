"use strict";
//Server Stubs
var Twitter;
(function (Twitter) {
    function postDirectmessagesnew(body) {
        // your implementation here
    }
    Twitter.postDirectmessagesnew = postDirectmessagesnew;
    function postStatusesupdate(body) {
        // your implementation here
    }
    Twitter.postStatusesupdate = postStatusesupdate;
    function postListmemberscreate(body) {
        // your implementation here
    }
    Twitter.postListmemberscreate = postListmemberscreate;
    postListmemberscreate({ slug: "5", screen_name: "boe", owner_id: 25 });
})(Twitter = exports.Twitter || (exports.Twitter = {}));
