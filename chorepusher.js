/* appjet:version 0.1 */

import("lib-sessions");
import("lib-hmac");
import("storage");

if(! storage.chores){ storage.chores= new StorableCollection(); }
if(! storage.accounts){ storage.accounts = new StorableCollection(); }

// these lines are dangerous and will kill me at least once.
/*
// kill count: 1
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
      lastCompleted: "--",
      frequency: 0,
      dateCreated: new Date(),

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

      nextDone: function()
      {
        try { return(new Date(this.lastCompleted.getTime() + this.frequency)); }
        catch(error){
         return(new Date(this.dateCreated.getTime() + this.frequency)); 
        }
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
          return({id: this.id, email: this.email, name: this.name, priority: this.priority, lastCompleted: this.lastCompleted, frequency: this.frequency, dateCreated: this.dateCreated});
        }else{
          return({email: this.email, name: this.name, priority: this.priority, lastCompleted: this.lastCompleted, frequency: this.frequency, dateCreated: this.dateCreated});
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

function assureSignedIn(){ if(! session.account_id){ response.redirect("/"); } }
function setAccountSession (account) { session.account_id = account.id }
function niceDate(date){
  try { return(""+(date.getMonth()+1)+"/"+(date.getDate())) }
  catch (error) {
    return(date)
  }
}

function assureSignedInOwnsChore(choreId){
  if(! choreId){ response.redirect("/home"); }
  var account = getStorable(session.account_id);
  var chore   = getStorable(choreId);

  if(chore.email != account.email){
    response.redirect("/sign_out");
  }
  return(chore)
}

function writeSelected(a, name, b){
  print(html("<option value=\""+a+"\""));
  if(b && a==b){print(" selected=\"selected\"")}
  print(html(">"));
  print(name);
  print(html("</option>"));
}

function choreForm(name, args){
    var day   = 86400000;
    var week  = 604800000;
    var month = 2629743830;
    var year  = 31449600000;
    var repeatTimes = ''
    var foundUnit = day
  if(! args){
    args = {};
    formName = "/add_chore";
  }else{
    foundUnit = false;
    if(args.frequency > year){
      if(args.frequency % year == 0){repeatTimes = args.frequency/year; foundUnit=year }
    }
    if(args.frequency > month && foundUnit == false){
      if(args.frequency % month == 0){repeatTimes = args.frequency/month; foundUnit=month }
    }
    if(args.frequency > week && foundUnit == false){
      if(args.frequency % week == 0){repeatTimes = args.frequency/week; foundUnit=week }
    }
    if(foundUnit == false){
      repeatTimes = args.frequency/day;
      foundUnit = 'days';
    }
    formName = "/edit_chore/"+args.id;
  }
  print(html("<form action=\""+formName+"\" method=\"post\">"));
  print(html("""
      <table>
        <tr>
          <td><label for="name">name</label</td>
          <td><input type="text" name="name" id="chore_name"
      """));
      if(args.name){ print("value=\""+args.name+"\"")}
      print(html("""
      /></td>
        </tr>
        <tr>
          <td><label for="priority">priority</label</td>
          <td>
            <select name="priority" id="chore_priority">"""));
              writeSelected(0.1, "minimal", args.priority);
              writeSelected(0.25, "light", args.priority);
              writeSelected(0.5, "medium", args.priority);
              writeSelected(0.75, "heavy", args.priority);
              writeSelected(1.0, "critical", args.priority);
              print(html("""
            </select>
          </td>
        </tr>
        <tr>
          <td><label for="frequency">frequency</label</td>
          <td>
           """));
           print(html("<input type=\"text\" name=\"frequency\" id=\"chore_frequency\" size=\"3\" value=\""+repeatTimes+"\" />"));
           print(html("<select name=\"frequency_duration\" id=\"chore_frequency_duration\">"));
              writeSelected(day, "days", foundUnit);
              writeSelected(week, "weeks", foundUnit);
              writeSelected(month, "months", foundUnit);
              writeSelected(year, "years", foundUnit);
            print(html("""
            </select>
          </td>
        </tr>
        <tr>
          <td colspan="2">"""));
          print(html("<input type=\"submit\" value=\""+name+" chore\" />"));
          print(html("""
            <a href="/home" title="cancel">cancel</a>
          </td>
        </tr>
      </table>
    </form>
  """)); //"""
}

  


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
   print(html("<p>They aren't being organized yet (beyond by priority), but they are stored and shown, and can even be edited.</p>"));
   print(html("<p>Passwords are not stored in plaintext and cannot currently be changed.</p>"));
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
    print(html("<h3>Add a Chore</h3>"));
    choreForm("add");
  break;
case "/home":
  assureSignedIn();
  account = Account.initializeById(session.account_id)

  page.setTitle("Chores");
  print(html("<h1> chores are currently being sorted only by priority</h1>"));
  print(html("<h1>Today is "+niceDate(new Date())+"</h1>"));
  print(html("<a href=\"/sign_out\">sign out</a>"));
  print(" | ");
  print(html("<a href=\"add_chore\">add a chore</a>"));
  print(html("""
  <table>
    <tr>
      <th>Name</th>
      <th>Last Completed</th>
      <th>Needs to be done by</th>
      <th>&nbsp;</th>
      <th>&nbsp;</th>
    </tr>
  """));

    var chore; 
    Chore.orderList(Chore.findByEmail(account.email)).forEach(function(item){
      chore = Chore.initializeFromCollection(item);
      print(html("<tr>"));
        print(html("<td><a href=\"edit_chore/"+chore.id+"\">"+chore.name+"</a></td><td>"+niceDate(chore.lastCompleted)+"</td>"));
        print(html("<td>"+niceDate(chore.nextDone())+"</td>"));
        print(html("<td>"));
          print(html("<a href=\"chore_completed/"+chore.id+"\" title=\"mark "+chore.name+" as complete\">complete!</a>"));
        print(html("</td>"));
        print(html("<td>"));
          //print("["+html("<a href=\"deleterer_chore/"+chore.id+"\" title=\"delete "+chore.name+" forever\" onClick=\"confirm(\"are you sure you want to delete this?\");\">X</a>")+"]");
        print(html("</td>"));
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
    <p>Passwords are not stored in plaintext and cannot currently be changed.</p>
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
            <a href="/
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
  default:
    if(request.path.match("chore_completed")){
      assureSignedIn();      
      var choreId = request.path.split("/")[2];
      assureSignedInOwnsChore(choreId);
      var chore  = getStorable(choreId);
      chore.lastCompleted = new Date();
      response.redirect("/home");
    }else{ 
    if(request.path.match("edit_chore")){
      assureSignedIn();
      var choreId = request.path.split("/")[2];
      assureSignedInOwnsChore(choreId)
      if(request.params.name &&
         request.params.priority &&
         request.params.frequency &&
         request.params.frequency_duration)
      {
        var chore     = getStorable(choreId);
        var frequency = ((request.params.frequency*1)*(request.params.frequency_duration*1));
        chore.frequency = frequency;
        chore.name = request.params.name;
        chore.priority = request.params.priority;
        response.redirect("/home");
      }
      choreForm("edit", getStorable(choreId));
    }else{
    if(request.path.match("delete_chore")){
      assureSignedIn();
      var choreId = request.path.split("/")[2];
      var chore = assureSignedInOwnsChore(choreId);
      Chore.collection.remove(getStorable(choreId));
      response.redirect("/home");
    }else{ print(html("<h1>40flol</h1>")); print("wat u don heer lol"); }
  }
  }
  break;
}

