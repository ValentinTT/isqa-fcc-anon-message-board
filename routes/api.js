/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect = require('chai').expect;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

const ReplySchema = new Schema({
  text: {type: String, required: true},
  created_on: {type: Date, default: () => new Date()},
  reported: {type: Boolean, default: false},
  delete_password: {type: String, required: true}
});

const ThreadSchema = new Schema({
  text: {type: String, required: true},
  created_on: {type: Date, default: () => new Date()},
  bumped_on: {type: Date, default: () => new Date()},
  reported: {type: Boolean, default: false},
  delete_password: {type: String, required: true},
  replies: [ReplySchema]
});

const BoardSchema = new Schema({
  name: {type: String, required: true},
  created_on: {type: Date, default: () => new Date()},
  threads: [ThreadSchema],
  delete_password: {type: String, default: "delete"}
});

const Board = mongoose.model("Board", BoardSchema);

module.exports = (app) => {
  
  app.route('/api/threads/:board')
  .post((req, res, next) => {
    const boardName = req.params.board;
    const threadText = req.body.text;
    const deletePassword = req.body.delete_password;
    if(!boardName) return res.send("There must be specified a board");
    if(!threadText) return res.send("There must be specified the thread's text");
    if(!deletePassword) return res.send("There must be specified a passowrd for deleting the thread");
    
    Board.findOne({name: boardName}, (err, board) => {
      if(err) return res.send("There was an error searching the board");
      else if(board) {
        let thread = board.threads.find(t => t.text === threadText);
        if(thread) return res.send("There is already a thred called " + threadText + " on the " + boardName + " board");
        else {
          board.threads.push({
            text: threadText,
            delete_password: deletePassword
          });
          board.save((err) => err? 
                     res.send("There was an error saving the thread, please try again"):
                     res.redirect("/b/" + boardName));
        }
      }
      else {
        new Board({
          name: boardName,
          threads: [{text: threadText,delete_password: deletePassword}]
        }).save((err, b) => err?
                res.send("There was an error saving the thread, please try again"):
                res.redirect("/b/" + boardName)
        );
      }
    });
  })
  .get((req, res, next) => {
    const boardName = req.params.board;
    if(!boardName) return res.send("You need to specified a board");
    
    Board.findOne({name: boardName}, (err, board) => {
      if(err) return res.send("There was an error finding the board " + boardName);
      else if(!board) return res.send("There is no board called " + boardName);
      
      let threads = [...board.threads];
      threads.sort((a, b) => b.bumped_on - a.bumped_on);
      threads = threads.slice(0, 10).map(t => {
        let replies = [...t.replies];
        replies.sort((a, b) => b.created_on - a.created_on);
        replies = replies.slice(0, 3);
        replies = replies.map(r => ({
          text: r.text,
          created_on: r.created_on,
          reported: r.reported,
          _id: r._id
        }));
        return {
          text: t.text,
          reported: t.reported,
          created_on: t.created_on,
          bumped_on: t.bumped_on,
          _id: t._id,
          replycount: t.replies.length,
          replies
        }
      });
      return res.send(threads);
    });
  })
  .delete((req, res, next) => {
    const boardName = req.params.board;
    const threadId = req.body.thread_id;
    const deletePassword = req.body.delete_password;
    if(!boardName) return res.send("There must be specified a board");
    if(!threadId) return res.send("There must be specified the thread's id");
    if(!deletePassword) return res.send("There must be specified a passowrd for deleting the thread");
    
    Board.findOne({name: boardName}, (err, board) => {
      if(err) return res.send("There was en error finding the board " + boardName);
      else if(!board) return res.send("There is no board called " + boardName);
      
      let thread = board.threads.id(threadId);
      if(!thread) return res.send("There is no thread with the id " + threadId);
      if(thread.delete_password === deletePassword) {
        thread.remove();
        board.save(err => err? res.send("error saving the board's changes"): res.send("success"));
      } else return res.send("incorrect password");
    });
  })
  .put((req, res, next) => {
    const boardName = req.params.board;
    const threadId = req.body.thread_id;
    if(!boardName) return res.send("There must be specified a board");
    if(!threadId) return res.send("There must be specified the thread's id");
    
    Board.findOne({name: boardName}, (err, board) => {
      if(err) return res.send("There was an error finding the board " + boardName);
      if(!board) return res.send("There is no board called " + boardName);
      
      let thread = board.threads.id(threadId);
      if(!thread) return res.send("There is no thread with the id " + threadId);
      
      thread.reported = true;
      board.save(err => err? res.send("Error saving the changes on the db"): res.send("success"));
    });
  });
    
  app.route('/api/replies/:board')
  .post((req, res, next) => {
    const boardName = req.params.board;
    const threadId = req.body.thread_id;
    const replyText = req.body.text;
    const deletePassword = req.body.delete_password;
    if(!boardName) return res.send("There must be specified a board");
    if(!threadId) return res.send("There must be specified a thread id");
    if(!replyText) return res.send("The reply must contain text");
    if(!deletePassword) return res.send("The reply needs to have a password to delete it");
    
    Board.findOne({name: boardName}, (err, board) => {
      if(err) return res.send("There was an error finding the board");
      else if(!board) return res.send("There is no board called " + boardName);
      
      let thread = board.threads.id(threadId);
      if(!thread) return res.send("There is no thread with the id " + threadId);
      
      const created_on = new Date(); //Cause otherwise the thread.bumped_on and the reply.created_on are not the same
      thread.replies.push({
        text: replyText,
        delete_password: deletePassword,
        created_on
      });
      thread.bumped_on = created_on;
      board.save(err => err? 
                 res.send("There was an error saving the reply "):
                 res.redirect("/b/" + boardName + "/" + threadId)
      );
    });
  })
  .get((req, res, next) => {
    const boardName = req.params.board;
    const threadId = req.query.thread_id;
    if(!boardName) return res.send("You have to specified a board name");
    if(!threadId) return res.send("You have to specified the thread's id");
    
    Board.findOne({name: boardName}, (err, board) => {
      if(err) return res.send("There was an error searching the board " + boardName);
      else if(!board) return res.send("There is no board called " + boardName);
      
      let thread = board.threads.id(threadId);
      if(!thread) return res.send("There is no thread with the id " + threadId);
      
      let replies = [...thread.replies];
      replies.sort((a, b) => b.created_on - a.created_on);
      replies = replies.map(r => ({
        text: r.text,
        created_on: r.created_on,
        reported: r.reported,
        _id: r._id
      }));
      
      return res.send( {
          text: thread.text,
          reported: thread.reported,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          _id: thread._id,
          replycount: thread.replies.length,
          replies
      });
    });
  })
  .delete((req, res, next) => {
    const boardName = req.params.board;
    const threadId = req.body.thread_id;
    const replyId = req.body.reply_id;
    const deletePassword = req.body.delete_password;
    if(!boardName) return res.send("There must be specified a board");
    if(!threadId) return res.send("There must be specified the thread's id");
    if(!replyId) return res.send("There must be specified thre reply's id");
    if(!deletePassword) return res.send("There must be specified a passowrd for deleting the reply");
    
    Board.findOne({name: boardName}, (err, board) => {
      if(err) return res.send("There was an error finding the board " + boardName);
      else if(!board) return res.send("There is no board called " + boardName);
      
      let thread = board.threads.id(threadId);
      if(!thread) return res.send("There is no thread with the id " + threadId);
      
      let reply = thread.replies.id(replyId);
      if(!reply) return res.send("There is no reply with the id " + replyId);
      
      if(reply.delete_password === deletePassword) {
        reply.text = "[deleted]";
        board.save(err => err? res.send("error saving the board's changes"): res.send("success"));
      } else return res.send("incorrect password");
    });
  })
  .put((req, res, next) => {
    const boardName = req.params.board;
    const threadId = req.body.thread_id;
    const replyId = req.body.reply_id;
    if(!boardName) return res.send("There must be specified a board");
    if(!threadId) return res.send("There must be specified the thread's id");
    if(!replyId) return res.send("There must be specified thre reply's id");
    
    Board.findOne({name: boardName}, (err, board) => {
      if(err) return res.send("There was an error finding the board " + boardName);
      if(!board) return res.send("There is no board called " + boardName);
      
      let thread = board.threads.id(threadId);
      if(!thread) return res.send("There is no thread with the id " + threadId);
      
      let reply = thread.replies.id(replyId);
      if(!reply) return res.send("There is no reply with the id " + replyId);
      
      reply.reported = true;
      board.save(err => err? res.send("There was a problem saving the changes on the db"): res.send("success"));
    });
  });
/* There is a method: 
parent.children.id(id) that does the same thing that 
parent.children.find(findThreadById(threadId))
  const findThreadById = threadId => t =>{
    try {
      return t._id.equals(mongoose.Types.ObjectId(threadId));
    } catch(e) { return false; }
  };
  
  const findReplyById = replyId => r => {
    try {
      return r._id.equals(mongoose.Types.ObjectId(replyId));
    } catch(e) { return false; }
  }
*/
};
