/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *   I decided to change the order, so I could use the id of the thread created to add
 *   replies to it, before deleting the thread
 *       (if additional are added, keep them at the very end!) 
 */

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

let threadId, replyId;

chai.use(chaiHttp);
suite('Functional Tests', () => {

  suite('API ROUTING FOR /api/threads/:board', () => {

    suite('POST', () => {
      test("Post a new thread on test board", done => {
        chai.request(server)
          .post("/api/threads/test")
          .send({
            text: "test thread 1",
            delete_password: "delete thread"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.match(res.redirects[0], /\/b\/test$/);
            done();
          });
      });

      test("Post a new thread on test board, without passing the thread's text", done => {
        chai.request(server)
          .post("/api/threads/test")
          .send({
            tdelete_password: "delete thread"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "There must be specified the thread's text");
            done();
          });
      });

      test("Post a new thread on test board, without passing the thread's delete password", done => {
        chai.request(server)
          .post("/api/threads/test")
          .send({
            text: "test thread 1"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "There must be specified a passowrd for deleting the thread");
            done();
          });
      });
    });

    suite('GET', () => {
      test("Get top 10 threads on board", done => {
        chai.request(server)
          .get("/api/threads/test")
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body, "The body's response must be an array");
            assert.containsAllKeys(res.body[0], ["text", "reported", "created_on", "bumped_on", "_id", "replycount", "replies"]);
            assert.isArray(res.body[0].replies, "The replies property has to be an array");
            threadId = res.body[0]._id;
            done();
          });
      });
    });

    suite('PUT', () => {
      test("Mark a thread as reported, passing an incorrect id", done => {
        chai.request(server)
          .put("/api/threads/test")
          .send({
            thread_id: threadId + "lorem"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "There is no thread with the id " + threadId + "lorem");
            done();
          });
      });

      test("Mark a thread as reported", done => {
        chai.request(server)
          .put("/api/threads/test")
          .send({
            thread_id: threadId
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });
  });


  suite('API ROUTING FOR /api/replies/:board', () => {

    suite('POST', () => {
      test("Post a new reply on test thread 1", done => {
        chai.request(server)
          .post("/api/replies/test")
          .send({
            thread_id: threadId,
            text: "reply 1 on test thread 1",
            delete_password: "delete reply"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.match(res.redirects[0], new RegExp("/b/test/" + threadId + "$"));
            done();
          });
      });

      test("Post a new reply on test thread 1, without passing the thread id", done => {
        chai.request(server)
          .post("/api/replies/test")
          .send({
            text: "reply 1 on test thread 1",
            delete_password: "delete reply"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "There must be specified a thread id");
            done();
          });
      });

      test("Post a new reply on test thread 1, without passing the reply text", done => {
        chai.request(server)
          .post("/api/replies/test")
          .send({
            thread_id: threadId,
            delete_password: "delete reply"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "The reply must contain text");
            done();
          });
      });

      test("Post a new reply on test thread 1, without passing the thread id", done => {
        chai.request(server)
          .post("/api/replies/test")
          .send({
            thread_id: threadId,
            text: "reply 1 on test thread 1",
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "The reply needs to have a password to delete it");
            done();
          });
      });
    });

    suite('GET', () => {
      test("Get a thread", done => {
        chai.request(server)
          .get("/api/replies/test")
          .query({
            thread_id: threadId
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isObject(res.body, "The body needs to be an object");
            assert.containsAllKeys(res.body, ["text", "reported", "created_on", "bumped_on", "_id", "replycount", "replies"]);
            assert.isArray(res.body.replies, "The replies object needs to be an array");
            assert.containsAllKeys(res.body.replies[0], ["text", "reported", "created_on", "_id"]);
            replyId = res.body.replies[0];
            done();
          });
      });
    });

    suite('PUT', () => {
      test("Mark a reply as reported, without passing the reply's 'id", done => {
        chai.request(server)
          .put("/api/replies/test")
          .send({
            thread_id: threadId
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "There must be specified thre reply's id");
            done();
          });
      });

      test("Mark a reply as reported, passing an incorrect thread's id", done => {
        chai.request(server)
          .put("/api/replies/test")
          .send({
            thread_id: threadId + "lorem",
            reply_id: replyId
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "There is no thread with the id " + threadId + "lorem");
            done();
          });
      });

      test("Mark a reply as reported, passing an incorrect reply's id", done => {
        chai.request(server)
          .put("/api/replies/test")
          .send({
            thread_id: threadId,
            reply_id: replyId + "lorem"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "There is no reply with the id " + replyId + "lorem");
            done();
          });
      });

      test("Mark a reply as reported", done => {
        chai.request(server)
          .put("/api/replies/test")
          .send({
            thread_id: threadId,
            reply_id: replyId
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });

    suite('DELETE', () => {
      test("Delete a reply, passing a wrong delete password", done => {
        chai.request(server)
          .delete("/api/replies/test")
          .send({
            thread_id: threadId,
            reply_id: replyId,
            delete_password: "don't delete reply"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });

      test("Delete a reply, omitting the thread's id", done => {
        chai.request(server)
          .delete("/api/replies/test")
          .send({
            reply_id: replyId,
            delete_password: "delete reply"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "There must be specified the thread's id");
            done();
          });
      });

      test("Delete a reply, omitting the reply's id", done => {
        chai.request(server)
          .delete("/api/replies/test")
          .send({
            thread_id: threadId,
            delete_password: "delete reply"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "There must be specified thre reply's id");
            done();
          });
      });

      test("Delete a reply, passing a wrong delete password", done => {
        chai.request(server)
          .delete("/api/replies/test")
          .send({
            thread_id: threadId,
            reply_id: replyId,
            delete_password: "don't delete reply"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });

      test("Delete a reply, passing a wrong delete password", done => {
        chai.request(server)
          .delete("/api/replies/test")
          .send({
            thread_id: threadId,
            reply_id: replyId,
            delete_password: "delete reply"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });

  });

  suite('API ROUTING FOR /api/threads/:board', () => {
    suite('DELETE', () => {
      test("Delete a thread, passing a wrong delete password", done => {
        chai.request(server)
          .delete("/api/threads/test")
          .send({
            thread_id: threadId,
            delete_password: "don't delete thread"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });

      test("Delete a thread, passing a wrong threads id", done => {
        chai.request(server)
          .delete("/api/threads/test")
          .send({
            thread_id: threadId + "lorem",
            delete_password: "delete thread"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "There is no thread with the id " + threadId + "lorem");
            done();
          });
      });

      test("Delete a thread, passing a wrong threads id", done => {
        chai.request(server)
          .delete("/api/threads/test")
          .send({
            thread_id: threadId,
            delete_password: "delete thread"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });
  });
});