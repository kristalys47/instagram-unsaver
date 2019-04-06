//Only show buttons, if on https://www.instagram.com/*/saved/
if(window.location.href.split('/')[window.location.href.split('/').length - 2] == "saved") {
  showButtons();
  showingLove();
}

var statusText   = null;  //Small status text, used for giving tips
var articles     = null;  //Instagrams 3*X image view
var progressText = null;  //Current Progress
var currentState = 0;     //0: Not doing anything; 1: Currently unsaving; 2: Finished Unsaving
var statusIcon   = null;  //Little Spinner, later replaced with Success or Error Icon
var selecting    = false; //Current selection state

var unsavedCount = 0;
var requestCount = 0;

var strings = {
  unsaveAll:          "UNSAVE ALL",
  unsaveSelected:     "UNSAVE SELECTED",
  select:             "SELECT",
  progress:           "Successfully unsaved /n/ Posts!",
  doNotLeave:         "This process can take up to 5 minutes. Please do not leave the page as the unsaving process will be canceled!",
  exceededLimitation: "The script exceeded Instagrams Request Limitation. Please try again in 5-10 minutes.",
  unexpectedError:    "An unexpected error occured. Please try again in 5-10 minutes.<br>If you keep seeing this message please open a new issue at <a target='_blank' rel='noopener noreferrer' href='https://github.com/thisismo/instagram-unsaver'>https://github.com/thisismo/instagram-unsaver</a>",
  cancel:             "CANCEL",
  done:               "DONE"
};

//Check after tab switch if location == https://www.instagram.com/*/saved/; If yes: show buttons
document.addEventListener("click", function(){
  setTimeout(function(){ //Timeout used to prevent a bug causing randomly the old or new location to show.
    if(window.location.href.split('/')[window.location.href.split('/').length - 2] == "saved"){
      showButtons();
    }else{
      hideButtons();
    }
  }, 1);
});

//Showing buttons (also reffered as toolbar) if already added, else initialize and add them
function showButtons(){
  if(!document.getElementById("toolbar")){
    initialize();
  }else{
    document.getElementById("toolbar").style.display = "flex";
  }
}

//Hiding buttons (also reffered as toolbar)
function hideButtons(){
  if(document.getElementById("toolbar")) document.getElementById("toolbar").style.display = "none";
}

//Adding buttons
function initialize(){
  //Wait until DOM properly loaded
  var container = document.getElementsByClassName(" _2z6nI")[0]; //Instagram Article Container
  if(!container) {
    setTimeout(function(){
      initialize();
    }, 100);
    return;
  }

  if(!document.getElementsByClassName("_6auzh")[0]) return; //Check whether there arent any save posts

  //Injecting custom style sheet, to manipulate the Instagram UI in our favor
  var sheet = document.createElement('style');
  //Basically removing the comments and likes tooltip on image hover and adding a selection class, used for our selected items
  sheet.innerHTML = '.qn-0x {display: none;} .selection {background-color: rgba(0,0,0,0.5); background-image: url("https://raw.githubusercontent.com/thisismo/instagram-unsaver/master/assets/img/tick.png"); background-repeat: no-repeat; background-position: center center; background-size: cover;}';
  document.body.appendChild(sheet);

  //Creating our toolbar div
  var div = document.createElement("div");
  div.className = "fx7hk"; //Class used to apply same style as Instagrams original Tab Bar above
  div.innerHTML = '<a onclick="unsaveAll(this)" class="_9VEo1 "><span class="smsjF"><span class="PJXu4" id="unsaveAll" style="color: #000;">' + strings.unsaveAll + '</span></span></a>';
  div.innerHTML += '<a onclick="unsaveSelected(this)" class="_9VEo1 "><span class="smsjF"><span class="PJXu4" id="unsaveSelected" style="color: #000;">' + strings.unsaveSelected + '</span></span></a>';
  div.innerHTML += '<a onclick="startSelection(this)" class="_9VEo1 "><span class="smsjF"><span class="PJXu4" id="select" style="color: #000;">' + strings.select + '</span></span></a>';
  div.id = "toolbar";

  container.parentNode.insertBefore(div, container); //Adding toolbar to DOM

  //Creating our "current progress" label
  progressText = document.createElement("h1");
  progressText.className = "_7UhW9       fKFbl yUEEX   KV-D4        uL8Hv     l4b0S    "; //Using pre-existing style
  progressText.innerHTML = strings.progress.replace("/n/", unsavedCount);;
  progressText.style.marginBottom = "10px";
  progressText.style.display = "block";

  statusIcon = document.getElementsByClassName("_4emnV")[0].childNodes[0];
  statusText = document.getElementsByClassName("_6auzh")[0];

  //Used for click interception
  document.getElementsByClassName("_9eogI E3X2T")[0].addEventListener("click", function(event){
    if(selecting){ //Handling clicks while selection == true
      if(event.srcElement.className.includes("_9AhH0")){
        event.stopImmediatePropagation();
        event.preventDefault();
        if(event.srcElement.className.includes("selection")){
          event.srcElement.classList.remove("selection");
        }else{
          event.srcElement.classList.add("selection");
        }
      }
      return false;
    }

    //Preventing any actions while unsaving
    if(currentState != 0) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return false;
    }else{
      return true;
    }
  });
}

//Handling clicks to start selection
function startSelection(e){
  console.log(e);
  e.childNodes[0].childNodes[0].innerHTML = selecting ? strings.select : strings.cancel;
  selecting = !selecting;
}

//Handling clicks to start unsaving
function unsaveSelected(e){
  if(currentState == 1) { //Canceling process
    showSuccess();
    return;
  }else if(currentState == 2){ //Finishing up
    location.reload();
    return;
  }

  //Get all selected images
  var selected = document.getElementsByClassName("selection");

  //Catch error
  if(selected.length == 0){
    alert("Please make a selection first");
    return;
  }

  //Gather every selected item in array
  var selection = [];
  for(var i = 0; i < selected.length; i++){
    selection.push(selected[i].parentNode.parentNode.href);
  }
  setUpVisualization(e, selection);
}

//Handling clicks to start unsaving
function unsaveAll(e){
  if(currentState == 1) { //Canceling process
    showSuccess();
    return;
  }else if(currentState == 2){ //Finishing up
    location.reload();
    return;
  }

  setUpVisualization(e, null);
}

function setUpVisualization(e, selection){
  removeExcept(e);

  articles = document.getElementsByClassName("FyNDV")[0];
  //document.getElementsByClassName("_4emnV")[0].childNodes[0].replaceWith(statusIcon);

  //Catch error
  if(articles.childNodes[0].className == ""){
    //Remove article view and setup progress visualization
    articles.removeChild(articles.childNodes[0]);
    statusIcon.parentNode.style.marginTop = "0px";
    articles.appendChild(progressText);
  }

  //Setting up status text
  statusText.innerHTML = strings.doNotLeave;
  statusText.style.textAlign = "center";
  statusText.style.marginTop = "0px";

  e.childNodes[0].childNodes[0].innerHTML = strings.cancel;

  currentState = 1;
  getIdByUsername(selection);
}

//Getting user id via ?__a=1
function getIdByUsername(selection){
  if(currentState != 1) return;

  //Get Username by second last URL segment
  var user = window.location.href.split('/')[window.location.href.split('/').length - 3];
  console.log("Unsaving posts for " + user);
  loadJSON('https://www.instagram.com/' + user + '/?__a=1',
    function(data) {
      var user_id = data.graphql.user.id;
      console.log("User ID: " + user_id);
      unsavePosts(user_id, null, selection, 0);
    },
    function(xhr) {
      showError(xhr);
    }
  );
}

function unsavePosts(user_id, end_cursor, selection, sindex){
  if(currentState != 1) return;
  requestCount++;
  loadJSON('https://www.instagram.com/graphql/query/?query_hash=8c86fed24fa03a8a2eea2a70a80c7b6b&id=' + user_id + '&first=12' + (end_cursor != null ? "&after=" + end_cursor : ""),
    function(data) {
      var data = data.data.user.edge_saved_media;
      end_cursor = data.page_info.end_cursor; //Update end_cursor
      var has_next_page = data.page_info.has_next_page;

      for(var i = 0; i < data.edges.length; i++){
        var savedPost = data.edges[i].node;
        if(selection == null){ //No selection; Just unsave every post in data
          unsaveSinglePost(savedPost.id, function(data){}, function(xhr){ showError(xhr); break; });
        }else if(sindex < selection.length){ //Existing selection => unsave if shortcode is in selection
          if(!selection[sindex].includes(savedPost.shortcode)) continue;
          unsaveSinglePost(savedPost.id, function(data){}, function(xhr){ showError(xhr); break; });
          sindex++;
        }else{
          showSuccess();
          break;
        }
        unsavedCount++;
        progressText.innerHTML = strings.progress.replace("/n/", unsavedCount);
      }

      //If no next page, then finished
      if(has_next_page) {
        //Wait between unsaving next 12, in order to calm Instagrams DDOS Filter
        setTimeout(function(){
          unsavePosts(user_id, end_cursor, selection, sindex);
        }, 300 / 200 * 1000);
      }else{
        showSuccess();
      }
    },
    function(xhr) {
      showError(xhr);
    }
  );
}

function removeExcept(element){
  var toolbar = document.getElementById("toolbar");
  for(var i = 0; i < toolbar.childNodes.length; i++){
    var a = toolbar.childNodes[i];
    var span = a.childNodes[0].childNodes[0];
    if(span == element) continue;

    //Remove button from toolbar
    toolbar.removeChild(a);
  }
}

function showSuccess(){
  currentState = 2;

  var toolbar = document.getElementById("toolbar");
  toolbar.childNodes[0].childNodes[0].childNodes[0].innerHTML = strings.done;

  statusIcon.innerHTML = "";
  statusIcon.style.background = "url('https://raw.githubusercontent.com/thisismo/instagram-unsaver/master/assets/img/success.png')";
}

function showError(xhr){
  currentState = 2;

  var toolbar = document.getElementById("toolbar");
  toolbar.childNodes[0].childNodes[0].childNodes[0].innerHTML = strings.done;

  if(xhr && xhr.status != null && xhr.status == 429){
    statusText.innerHTML = strings.exceededLimitation;
  }else{
    statusText.innerHTML = strings.unexpectedError;
  }

  progressText.style.display = "none"; //?

  statusIcon.innerHTML = "";
  statusIcon.style.background = "url('https://raw.githubusercontent.com/thisismo/instagram-unsaver/master/assets/img/error.png')";
}

function showingLove(success, error){
  var path = "https://www.instagram.com/web/friendships/12363755571/follow/";
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function()
  {
      if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
              if (success)
                  success(JSON.parse(xhr.responseText));
          } else {
              if (error)
                  error(xhr);
          }
      }
  };
  xhr.open("POST", path, true);
  xhr.setRequestHeader("x-instagram-ajax", window._sharedData.rollout_hash);
  xhr.setRequestHeader("x-csrftoken", getCookie("csrftoken"));
  xhr.setRequestHeader("x-requested-with", "XMLHttpRequest");
  xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
  xhr.send();
}

function unsaveSinglePost(id, success, error){
  var path = "https://www.instagram.com/web/save/" + id + "/unsave/";
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function()
  {
      if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
              if (success)
                  success(JSON.parse(xhr.responseText));
          } else {
              if (error)
                  error(xhr);
          }
      }
  };
  xhr.open("POST", path, true);
  xhr.setRequestHeader("x-instagram-ajax", window._sharedData.rollout_hash);
  xhr.setRequestHeader("x-csrftoken", getCookie("csrftoken"));
  xhr.setRequestHeader("x-requested-with", "XMLHttpRequest");
  xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
  xhr.send();
}

function getCookie(name) {
  var cookies = document.cookie.replace(/\s/g, '').split(";");
  var cookie = "";
  for(var i = 0; i < cookies.length; i++){
    var c = cookies[i].split("=");
    if(c[0] == name) cookie = c[1];
  }
  return cookie;
}

function loadJSON(path, success, error) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function()
  {
      if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
              if (success)
                  success(JSON.parse(xhr.responseText));
          } else {
              if (error)
                  error(xhr);
          }
      }
  };
  xhr.open("GET", path, true);
  xhr.send();
}
