/* appjet:version 0.1 */

import("lib-sessions");
import("lib-hmac");
import("storage");

if(! storage.chores){ storage.chores= new StorableCollection(); }
if(! storage.accounts){ storage.accounts = new StorableCollection(); }

// these lines are dangerous and will kill me at least once.
/*
storage.accounts.remove({});
storage.chores.remove({});
*/

/*
 * Class: Chore
 *
 * Initialize With:
 *   Chore.initialize(name, priority)
 *   Chore.initializeFromCollection(choreCollection)
 *   Chore.initializeByName(name)
 * 
 */
var Chore = 
{
  collection: storage.chores,

  initializeFromCollection: function(input)
  {
    thisChore = Chore.initialize(input.email, input.name, input.priority);
    thisChore.setLastCompleted(input.lastCompleted);
    thisChore.setFrequency(input.frequency);
    thisChore.setId(input.id);
    return(thisChore);
  },

  initializeByName: function(name)
  {
    Chore.initializeFromCollection(Chore.findByName(name).first)
  },

  findByName: function(name)
  {
    Chore.collection.filter({name: name});
  },

  findByEmail: function(email)
  {
    return(Chore.collection.filter({email: email}));
  },

  initialize: function(email, name, priority)
  { 
    var instance = 
    {
      email: "",
      name: "",
      priority: 0.0,
      lastCompleted: new Date(),
      frequency: 0,

      setName: function(new_name)
      {
        this.name = new_name;
      },

      setEmail: function(new_email)
      {
        this.email = new_email;
      },

      setId: function(id)
      {
        this.id = id;
      },

      setPriority: function(new_priority)
      {
        this.priority = new_priority;
      },

      setFrequency: function(new_frequency)
      {
        this.frequency = new_frequency;
      },
            
      setLastCompleted: function(new_completed_date)
      {
        this.lastCompleted = new_completed_date;
      },

      markAsCompleted: function()
      {
        this.lastCompleted = new Date();
      },

      rank: function()
      {
        /* this method should create a ranking from 0.0 to 1.0
         * established by noting the chore's priority and 
         * the amount of time until next necessary completion,
         * possibly compared against the total duration of frequency */
        return(this.priority);
      },

      asCollection: function(without_id){
        if(! without_id){
          return({id: this.id, email: this.email, name: this.name, priority: this.priority, lastCompleted: this.lastCompleted, frequency: this.frequency});
        }else{
          return({email: this.email, name: this.name, priority: this.priority, lastCompleted: this.lastCompleted, frequency: this.frequency});
        }
      },

      saveAsNew: function() {
        Chore.collection.add(this.asCollection(true))
        return(this)
      },
    }

    var init = function(email, name, priority){
      instance.setEmail(email);
      instance.setName(name);
      instance.setPriority(priority);
      return(instance);
    }

    return(init(email, name, priority));
  },

  compare: function(a, b)
  {
    a = Chore.initializeFromCollection(a);
    b = Chore.initializeFromCollection(b);
    if(a.rank() > b.rank()){
      return(-1);
    }else{
      if(a.rank() < b.rank()){
        return(1);            
      }else{
        return(0);
      }
    }
  },

  orderList: function(collection)
  {
    return(collection.sort(Chore.compare));
  },
}


/*
 * Class: Account
 *
 * Initialize With:
 *   Account.initialize(name, password)
 *   Account.initializeFromCollection(accountCollection)
 *
 * Usage:
 *   makeAccount = Account.create("evan.short@gmail.com", "frank");
 *   findAccount = Account.logIn("evan.short@gmail.com", "frank");
 *   makeAccount == findAccount // => true 
 */
var Account = 
{
  collection: storage.accounts,

  initializeFromCollection: function(input)
  {
    account = this.initialize(input.email, input.password) 
    account.setId(input.id)
    return(account)
  },

  initializeById: function(id)
  {
  
    return(getStorable(id));
  },

  initialize: function(email, password){ 
    var instance = 
    {
      id: '',
      email: '',
      password: '',

      setId: function(id)
      {
        this.id = id;
      },

      verify: function(unhashedPassword) 
      {
        if(hex_md5(unhashedPassword) == this.password){
          return(this);
        }else{
          return(false);
        }
      },
            
      setEmail: function(email)
      {
        this.email = email;
      },
            
      setPassword: function(password)
      {
        this.password = password;
      },

      create: function() {
        return(Account.collection.add(this.asCollection(true)));
      },

      asCollection: function(){
        return({
          email: this.email,
          password: this.password
        });
      },
    }

    var init = function(email, password){ 
      instance.setEmail(email);
      instance.setPassword(password);
      return(instance);
    }

    return(init(email, password));
  },

  logIn: function(email, password) {
    var foundAccount = Account.lookUp(email);
    if(foundAccount){
      return(foundAccount.verify(password)); // returns account instance if password is found
    }else{
      return(false);
    }
  },

  lookUp: function(email) {
    account = Account.collection.filter({email: email}).first()
    if(account){
      return(Account.initializeFromCollection(account)) ;
    }else{
      return(false);
    }
  },
}

var setAccountSession = function(account) { session.account_id = account.id }


switch(request.path){
case "/":
  if(session.account_id){
    response.redirect("/home");
  }else{
    if(request.params.email && request.params.password){
      account = Account.lookUp(request.params.email);
      if(account && account.verify(request.params.password)){
        // set the user and redirect to /home;
        setAccountSession(account)
        response.redirect("/home");
      }else{
        print("I'm sorry your information doesn't seem to be available");
      }
     }
   }
   page.setTitle("Sign Up or Sign In");
   print(html("<h1>Welcome. Make an account and add your chores.</h1>"));
   print(html("<p>They aren't being organized yet, but they are stored and shown.</p>"));
   print(html("<p>Hopefully I won't wipe out the whole database by accident.</p>"));
   print(html("<p>Passwords are not stored in plaintext and they cannot currently be changed.</p>"));
   print(html("""
    <h3>Sign In</h3>
    <form action="/" method="post">
      <table>
        <tr>
          <td><label for="email">Email:</label></td>
          <td><input type="text" name="email" 
    """));
    if(request.params.email != undefined){ print("value=\""+request.params.email+"\""); }
    print(html("""
        id="account_email" /></td>
        </tr>
        <tr>
          <td><label for="password">password:</label></td>
          <td><input type="password" name="password" id="account_password" /></td>
        </tr>
        <tr>
          <td>
          &nbsp;
           </td>
           <td>
            <input type="submit" value="sign in">
            <a href="/signup" title="sign up">sign up!</a>
           </td>
        </tr>
      </table>
    </form>
   """)); // poor vim syntax parser.... """
 break;
case "/add_chore":
  if(request.params.name &&
     request.params.priority &&
     request.params.frequency &&
     request.params.frequency_duration)
  {
    account = Account.initializeById(session.account_id);
    chore = Chore.initialize(account.email, request.params.name, request.params.priority);
    frequency = ((request.params.frequency*1)*(request.params.frequency_duration*1))
    chore.setFrequency(frequency)
    chore.saveAsNew();
    response.redirect("/home");
  }
  print(html("""
    <h3>Add a Chore</h3>
    <form action="/add_chore" method="post">
      <table>
        <tr>
          <td><label for="name">name</label</td>
          <td><input type="text" name="name" id="chore_name" /></td>
        </tr>
        <tr>
          <td><label for="priority">priority</label</td>
          <td>
            <select name="priority" id="chore_priority">
              <option value="0.1">minimal</option>
              <option value="0.25">light</option>
              <option value="0.5">medium</option>
              <option value="0.75">heavy</option>
              <option value="1.0">critical</option>
            </select>
          </td>
        </tr>
        <tr>
          <td><label for="frequency">frequency</label</td>
          <td>
            <input type="text" name="frequency" id="chore_frequency" size="3" />
            <select name="frequency_duration" id="chore_frequency_duration">
              <option value="86400">days</option>
              <option value="604800">weeks</option>
              <option value="2116800">months</option>
              <option value="31449600">years</option>
            </select>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <input type="submit" value="add chore" />
            <a href="/home" title="cancel">cancel</a>
          </td>
        </tr>
      </table>
    </form>
  """)); //"""
  break;
case "/home":
  if(! session.account_id){ response.redirect("/"); }
  account = Account.initializeById(session.account_id)

  page.setTitle("Chores");
  print(html("<h1> chores are currently being sorted only by priority</h1>"));
  print(html("<a href=\"/sign_out\">sign out</a>"));
  print(" | ");
  print(html("<a href=\"add_chore\">add a chore</a>"));
  print(html("""
  <table>
    <tr>
      <th>Name</th>
      <th>Last Completed</th>
      <th>Needs to be done by</th>
      <th>&nbsp</th>
    </tr>
  """));

  
    Chore.orderList(Chore.findByEmail(account.email)).forEach(function(chore){
      print(html("<tr>"));
        print(html("<td>"+chore.name+"</td><td>"+chore.priority+"</td>"));
        print(html("<td>"+chore.name+"</td><td>"+chore.priority+"</td>"));
      print(html("</tr>"));
    });
  print(html("</table>"));
  break;
case "/sign_out":
  session.account_id = undefined
  response.redirect("/")
  break;
case "/signup":
   if(request.params.email && request.params.password && request.params.email){
     if(Account.lookUp(request.params.email)){
       print("that name already exists in our system");
     }

     if(request.params.password.replace(/^\s+|\s+$/g, '') == "" ||
        request.params.c_password.replace(/^\s+|\s+$/g, '') == "" ||
        request.params.c_password != request.params.password){
          print("passwords do not match");
     }else{
       if(request.params.email.replace(/^\s+|\s+$/g, '') == ""){
          print("please enter an email address");
       }else{
         if(request.params.password == request.params.c_password && 
            request.params.password.replace(/^\s+|\s+$/g, '') != ""){
              account = Account.initialize(request.params.email, hex_md5(request.params.password)).create();
              setAccountSession(account)
              response.redirect("/home")
         }
     }
     }
   }
   
   page.setTitle("Sign Up");
   print(html("""
    <h3>Sign Up</h3>
    <form action="signup" method="post">
      <table>
        <tr>
          <td><label for="email">Email:</label></td>
          <td><input type="text" name="email" 
    """));
    if(request.params.email != undefined){ print("value=\""+request.params.email+"\""); }
    print(html("""
        id="account_email" /></td>
        </tr>
        <tr>
          <td><label for="password">password:</label></td>
          <td><input type="password" name="password" id="account_password" /></td>
        </tr>
        <tr>
          <td><label for="c_password">confirm password:</label></td>
          <td><input type="password" name="c_password" id="c_account_password" /></td>
        </tr>
        <tr>
          <td>
          &nbsp;
           </td>
           <td>
            <input type="submit" value="sign up">
            <a href="/" title="cancel">cancel</a>
           </td>
        </tr>
      </table>
    </form>
   """)); //"""
  break;
 
}

