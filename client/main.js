Todos = new Mongo.Collection('todos');
Lists = new Meteor.Collection('lists');


Meteor.subscribe('lists');
//Meteor.subscribe("userList");

Router.route('/', {
  name: 'home',
  template: 'home'
});
Router.route('/register');
Router.route('/login');
Router.configure({
  layoutTemplate: 'main',
  loadingTemplate: 'loading'
});

Router.route('/list/:_id', {
  name: 'listPage',
  template: 'listPage',
  data: function(){
    var currentList = this.params._id;
    var currentUser = Meteor.userId();
    return Lists.findOne({ _id: currentList, createdBy: currentUser });
  },
  onBeforeAction: function(){
    var currentUser = Meteor.userId();
    if(currentUser){
      this.next();
    } else {
      this.render("login");
    }
  },
  waitOn: function(){
    var currentList = this.params._id;
    return Meteor.subscribe('todos', currentList);
  }
});

/*
Router.route('/users', {
    name: 'viewUsers',
    template: 'viewUsers',
    waitOn: function() {
        return Meteor.subscribe('userList');
    },
    data: function() {
        return Meteor.users.find({});
    }
 });
*/

Template.viewUsers.onCreated(function(){
  this.subscribe("openUsers")
});

 Template.viewUsers.helpers({
   'user': function(){
     return Meteor.users.find({}, {sort: {'profile.lastlogin': 1}});
   },
   'userLists': function(user){
     return Lists.find({ createdBy: user}, {sort: {name: 1}}).count();
   },
   'isUserInRole': function(userId, role){
     return Roles.userIsInRole(userId, role);
     //return Meteor.call('isAdmin', userId, role);
   },
   'checkadmin': function(){
     var role = this.roles[0];
     //console.log(this)
     if(this.roles[0] == 'global-admin'){
       return "checked";
     } else {
       return null;
     }
   }
 });

$.validator.setDefaults({
    rules: {
        email: {
            required: true,
            email: true
        },
        password: {
            required: true,
            minlength: 6
        }
    },
    messages: {
        email: {
            required: "You must enter an email address.",
            email: "You've entered an invalid email address."
        },
        password: {
            required: "You must enter a password.",
            minlength: "Your password must be at least {0} characters."
        }
    }
});

Template.todos.helpers({
  'todo': function(){
    var currentList = this._id;
    var currentUser = Meteor.userId();
    return Todos.find({ listId: currentList, createdBy: currentUser }, {sort: {createdAt: 1}});
  }
});

Template.todoItem.helpers({
  'checked': function(){
    var isCompleted = this.completed;
    if(isCompleted){
      return "checked";
    } else {
      return "";
    }
  }
});

Template.todosCount.helpers({
  'totalTodos': function(){
    var currentList = this._id;
    return Todos.find({ listId: currentList }).count();
  },
  'completedTodos': function(){
    var currentList = this._id;
    return Todos.find({ listId: currentList, completed: true }).count();
  }
});

Template.lists.helpers({
  'list': function(){
    var currentUser = Meteor.userId();
    return Lists.find({ createdBy: currentUser }, {sort: {name: 1}});
  }
});

Template.lists.onCreated(function () {
  this.subscribe('lists');
});

Template.addTodo.events({
  'submit form': function(event){
    event.preventDefault();
    var todoName = $('[name="todoName"]').val();
    var currentList = this._id;
    Meteor.call('createListItem', todoName, currentList, function(error){
      if(error){
        console.log(error.reason);
      } else {
        $('[name="todoName"]').val('');
      }
    });
  }
});

Template.todoItem.events({
  'click .delete-todo': function(event){
    event.preventDefault();
    var documentId = this._id;
    var confirm = window.confirm("Delete this task?");
    if(confirm){
      Meteor.call('removeListItem', documentId);
    }
  },
  'keyup [name=todoItem]': function(event){
    if(event.which == 13 || event.which == 27){
      $(event.target).blur();
    } else {
      var documentId = this._id;
      var todoItem = $(event.target).val();
      Meteor.call('updateListItem', documentId, todoItem);
    }
  },
  'change [type=checkbox]': function(){
    var documentId = this._id;
    var isCompleted = this.completed;
    if(isCompleted){
      Meteor.call('changeItemStatus', documentId, false);
    } else {
      Meteor.call('changeItemStatus', documentId, true);
    }
  }
});

Template.viewUsers.events({
  'change [type=checkbox]': function(){
    var userId = this._id;
    var role = this.roles[0]
    console.log(role);
    if(role == 'global-admin'){
      var confirm = window.confirm("Are you sure you want to remove this Admin?");
      if(confirm){
        Meteor.call('updateRoles', userId, ['default-user']);
        console.log('Removed Admin:', userId);
      } else {
        window.location.reload();
      }
    } else {
      var confirm = window.confirm("Are you sure you want to make this user an Admin?");
      if(confirm){
        Meteor.call('updateRoles', userId, ['global-admin', 'default-user']);
        console.log('Added Admin:', userId);
      } else {
        window.location.reload();
      }
    }
  }
})

Template.addList.events({
  'submit form': function(event){
    event.preventDefault();
    var listName = $('[name=listName]').val();
    Meteor.call('createNewList', listName, function(error, results){
      if(error){
        console.log(error.reason);
      } else {
        Router.go('listPage', { _id: results });
        //event.target.reset();
        $('[name=listName]').val('');
      }
    });
    /*
    var currentUser = Meteor.userId();
    Lists.insert({
      name: listName,
      createdBy: currentUser
    }, function(error, results){
      Router.go('listPage', { _id: results });
    });
    //$('name=listName').val('');
    event.target.reset();
    */
  }
});

Template.register.events({
  'submit form': function(event){
    event.preventDefault();
    /*
    var email = $('[name=email]').val();
    var password = $('[name=password]').val();
    Accounts.createUser({
      email: email,
      password: password
    }, function(error){
      if(error){
        console.log(error.reason);
    } else {
        Router.go("home");
    }
    });
    */
  }
});

Template.login.onCreated(function(){
  console.log("The 'login' template was just created.")
});

Template.login.onRendered(function(){
  var validator = $('.login').validate({
    submitHandler: function(event){
      var email = $('[name=email]').val();
      var password = $('[name=password]').val();
      Meteor.loginWithPassword(email, password, function(error){
        if(error){
          if(error.reason == "User not found"){
            validator.showErrors({
              email: error.reason
            });
          }
          if(error.reason == "Incorrect password"){
            validator.showErrors({
              password: error.reason
            });
          }
        } else {
          var currentRoute = Router.current().route.getName();
          if(currentRoute == "login"){
            Router.go("home");
          }
          var currentUser = Meteor.userId();
          var date = new Date();
          var sdate = moment(date).format('l LT');
          Meteor.users.update({_id: currentUser}, {$set: { 'profile.lastlogin': sdate }});
          var log = Meteor.user().profile.numlogin;
          var nlog = log + 1;
          Meteor.users.update({_id: currentUser}, {$set: { 'profile.numlogin': nlog }});
        }
      });
    }
  });
});

Template.login.onDestroyed(function(){
  var currentUser = Meteor.userId();
  console.log("User: ", currentUser);
});

Template.register.onCreated(function(){
  console.log("The 'register' template was just created.")
});

Template.register.onRendered(function(){
  var validator = $('.register').validate({
    submitHandler: function(event){
      var email = $('[name=email]').val();
      var password = $('[name=password]').val();
      var username = $('[name=username]').val();
      var date = new Date();
      var sdate = moment(date).format('l LT');

      Meteor.call('createNewUser', email, password, username, sdate);
      Router.go("login");
    }, function(error){
        if(error){
          if(error.reason == "Email already exists."){
            validator.showErrors({
              email: "That email already belongs to a registered user."
            });
          }
          console.log('got caught up here.')
        } else {
          Router.go("home");
          console.log('going home');
        }
      }
  });
});

Template.register.onDestroyed(function(){
  console.log("The 'register' template was just destroyed.")
});

Template.login.events({
  'submit form': function(event){
    event.preventDefault();
    /*
    var email = $('[name=email]').val();
    var password = $('[name=password]').val();
    Meteor.loginWithPassword(email, password, function(error){
      if(error){
        console.log(error.reason);
      } else {
        var currentRoute = Router.current().route.getName();
        if(currentRoute == "login"){
          Router.go("home");
        }
      }
    });
    */
  }
});

Template.navigation.events({
  'click .logout': function(event){
    event.preventDefault();
    var currentUser = Meteor.userId();
    //var clock = Meteor.user().profile.workclock
    //var updateclock = clock + addclock
    //Meteor.users.update({_id: currentUser}, {$set: { 'profile.workclock': updateclock }})
    Meteor.logout();
    Router.go('login');
  }
});
