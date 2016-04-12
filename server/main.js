import { Meteor } from 'meteor/meteor';

Meteor.startup(function() {
  // if users database is empty, seed these values
  if(Meteor.users.find().count() < 1) {
    // users array
    var users = [
      { name: 'Admin', email: 'admin@email.io', password: 'qwerty', roles: ['global-admin']},
      { name: 'Kelly', email: 'kelly@email.io', password: 'qwerty', roles: ['default-user']},
      { name: 'hobbyist1', email: 'hob1@hobnob.com', password: 'qwerty', roles: ['default-user']},
      { name: 'hobbyist2', email: 'hob2@hobnob.com', password: 'qwerty', roles: ['default-user']}
    ];
    // user creation
    _.each(users, function(d) {
      // return id for use in roles assignment below
      var date = new Date();
      var sdate = moment(date).format('l LT');
      var userId = Accounts.createUser({
        email: d.email,
        password: d.password,
        profile: {
          name: d.name,
          lastlogin: sdate,
          numlogin: 0
        }
      });
      Meteor.users.update({ _id: userId }, { $set: { 'emails.0.verified': true } });
      Roles.addUsersToRoles(userId, d.roles);
    });
  }
});

Todos = new Mongo.Collection('todos');
Lists = new Meteor.Collection('lists');

Meteor.publish('userList', function (){
  return Meteor.users.find({});
});

Meteor.publish('openUsers', function (){
  //return Meteor.users.find({}, {fields: {roles: 1}});
  return Meteor.users.find({});
});

function defaultName(currentUser) {
    var nextLetter = 'A'
    var nextName = 'Untitled List ' + nextLetter;
    while (Lists.findOne({ name: nextName, createdBy: currentUser })) {
        nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
        nextName = 'Untitled List ' + nextLetter;
    }
    return nextName;
}

Meteor.methods({
  'createNewList': function(listName){
    var currentUser = Meteor.userId();
    check(listName, String);
    if(listName == ""){
    listName = defaultName(currentUser);
    }
    var data = {
      name: listName,
      createdBy: currentUser
    }
    if(!currentUser){
      throw new Meteor.Error("not-logged-in", "You're not logged-in.");
    }
    return Lists.insert(data);
  },
  'createListItem': function(todoName, currentList){
    check(todoName, String);
    check(currentList, String);
    var currentUser = Meteor.userId();
    var data = {
        name: todoName,
        completed: false,
        createdAt: new Date(),
        createdBy: currentUser,
        listId: currentList
    };
    if(!currentUser){
        throw new Meteor.Error("not-logged-in", "You're not logged-in.");
    }
    var currentList = Lists.findOne(currentList);
    if(currentList.createdBy != currentUser){
      throw new Meteor.Error("invalid-user", "You don't own that list.");
    }
    return Todos.insert(data);
  },
  'updateListItem': function(documentId, todoItem){
    check(todoItem, String);
    var currentUser = Meteor.userId();
    var data = {
      _id: documentId,
      createdBy: currentUser
    }
    if(!currentUser){
        throw new Meteor.Error("not-logged-in", "You're not logged-in.");
    }
    Todos.update(data, {$set: { name: todoItem }});
  },
  'changeItemStatus': function(documentId, status){
    check(status, Boolean);
    var currentUser = Meteor.userId();
    var data = {
        _id: documentId,
        createdBy: currentUser
    }
    if(!currentUser){
        throw new Meteor.Error("not-logged-in", "You're not logged-in.");
    }
    Todos.update(data, {$set: { completed: status }});
  },
  'removeListItem': function(documentId){
    var currentUser = Meteor.userId();
    var data = {
        _id: documentId,
        createdBy: currentUser
    }
    if(!currentUser){
        throw new Meteor.Error("not-logged-in", "You're not logged-in.");
    }
    Todos.remove(data);
  },
  'updateRoles': function(UserId,roles){
    var currentUser = Meteor.userId();
    if (!Roles.userIsInRole(currentUser,'global-admin')){
      throw new Meteor.Error(403, "Access denied")
    } else {
      Roles.setUserRoles(UserId,roles);
    }
  },
  //'isAdmin': function(userId){
  //  if (Roles.userIsInRole(userId, 'global-admin')){
  //    return true
  //  };
  //}
  'createNewUser': function(email, password, username, sdate){
    var defaultRoles = ['default-user'];
    var id = Accounts.createUser({
      email: email,
      password: password,
      profile: {
        name: username,
        lastlogin: sdate,
        numlogin: 0
      }
    });
    Roles.addUsersToRoles(id, defaultRoles);
  }
});

Meteor.publish('lists', function(){
  var currentUser = this.userId;
  return Lists.find({ createdBy: currentUser });
});

Meteor.publish('todos', function(currentList){
    var currentUser = this.userId;
    return Todos.find({ createdBy: currentUser, listId: currentList })
});
