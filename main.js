const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
var radiosData = require('./js/Model/radiosdata');
var searchStations = require('./js/Model/searchStations');
var advancedSearchStation = require('./js/Model/advancedSearchStation');
const { shell } = require('electron');
const sqlite3= require('sqlite3');

var radios = new radiosData();

var db = new sqlite3.Database('./favorites.db');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,     //In order to get access to ipc renderer 
      contextIsolation: false
    }
  })

  win.loadFile('index.html')
}

/**
 * Create table for favorite database
 */
function CreateTable()
{
    let query = "create table Favorites (stationuuid VARCHAR(100) PRIMARY KEY, name VARCHAR(100), favicon VARCHAR(1000), url VARCHAR(1000),homepage VARCHAR(1000) ,tags VARCHAR(1000) )";
   
    db.run(query, [], function(err) {
        if (err) {
            return console.log(err.message);
        }
        
        console.log(`success`);
    });
}
//CreateTable();



app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    db.close();
    app.quit()
  }
})

/**
 * Ask for datas. Reply when ready
 * @param {object} event_ event object
 * @param {string} tag_ searchterm
 * @param {string} tab_ tab name
 * @returns 
 */
function ask(event_,tag_,tab_)
{
  let data;
  if(radios.isReady() == false)
  {
    setTimeout(()=>{ask(event_,tag_,tab_)},500);
    return;
  }

  let search;
  switch(tag_)
  {
    case 'countries':   
      search = 'country'; 
      data = radios.getCountries();
      break;
    case 'tags':
      search = 'tag';
      data= radios.getTags();
      break;
    case 'codecs':
      search = 'codec';
      data = radios.getCodecs();
      break;
    case 'languages':
      search = 'language';
      data = radios.getLanguages();
      break;
    case 'states':
      search = 'state';
      data = radios.getStates();
      break;
    default:
  }
  event_.reply('replySearchTerms',data,tab_,search);
}

ipcMain.on('askSearchTerms',(event_, tag_,tab_)=> {
  ask(event_, tag_,tab_);
})

/**
 * Ask for an array of radio stations
 * @param {object} event_ An event object
 * @param {object} searchStations_ a class to get stations
 * @param {object} filter_ a filter object for radio-browser
 * @returns 
 */
function askRadios(event_, searchStations_,filter_)
{

  if(searchStations_.isReady()==false)
  {
    setTimeout(()=>{askRadios(event_,searchStations_,filter_);},500);
    return;
  }

  event_.reply('replyStations',searchStations_.getStations(),searchStations_.getfilter());
}

ipcMain.on('askRadios',(event_,filter_)=>{

  askRadios(event_,new searchStations(filter_),filter_);
});

ipcMain.on('openurl',(event_,url_)=>{
  console.log(url_);
  shell.openExternal(url_);
});

ipcMain.on('askFavorites',(event_)=>{
  getAllFavorites((rows_)=>{
    event_.reply('replyFavorites',rows_);
  });
});

ipcMain.on('askFavoritesOne',(event_)=>{
  getAllFavorites((rows_)=>{
    event_.reply('replyFavoritesOne',rows_);
  });
});

ipcMain.on('addFavorite',(event_,station_)=>{
  AddToFavorites(station_);
});

ipcMain.on('removeFavorite',(event_,station_)=>{
  console.log('remove');
  RemoveFromFavorites(station_);
 });

 function askAdvancedStations(event_,advSearch_)
 {
    if(advSearch_.isReady() == false)
    {
      setTimeout(() => {
        askAdvancedStations(event_,advSearch_);
      }, (500));
      return;
    }
    event_.reply('replayAdvancedStations',advSearch_.getStations());
 }

 ipcMain.on('AskAdvancedStations',(event_,stationName_)=>
 {
    console.log(stationName_);
    let filter = new Object();
    filter.name = stationName_;
    console.log(filter);
    let advSearch = new advancedSearchStation(filter);
    askAdvancedStations(event_,advSearch);
 })

function getAllFavorites(callback_)
{
    let query = "select * from favorites";
    //console.log(query);
    db.all(query, [], function(err,rows) {
        if (err) {
            return console.log(err.message);
        }

        callback_(rows);
    });
}


function AddToFavorites(station_)
{
    let query = "insert into favorites(stationuuid,name,url,homepage,favicon,tags) values('" + station_.stationuuid + "','" + station_.name + "','" + station_.url + "','" + station_.homepage +"','" + station_.favicon +  "','" +station_.tags + "')";
   // console.log(query);
    db.run(query, [], function(err) {
        if (err) {
            return console.log(err.message);
        }
        
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    });

}

/**
 * remove a station object from the favorite database
 * @param {object} station a station object
 */
 function RemoveFromFavorites(station_)
 {
   let uuid;
 
  uuid = station_.stationuuid;


     let query = "delete from favorites where stationuuid = '" +uuid  + "'";
     console.log(query);
     db.run(query, [], function(err) {
         if (err) {
             return console.log(err.message);
         }
     
         console.log(`A row has been removed with rowid ${this.lastID}`);
     });   
     
 }


 