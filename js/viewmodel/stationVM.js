const templateLoader = require( './templateLoader');
const playerVM = require( './PlayerVM');
const { ipcRenderer, ipcMain, Accelerator } = require('electron');

var g_player = new playerVM();

class stationVM extends templateLoader
{
    _li;
    _favorites;

    constructor()
    {
        super();
        this._getTemplate('./html/station.html','station').then((li)=>{this._li=li;});
        ipcRenderer.on('replyFavorites',(event_,favorites_)=>
        {
            this._favorites = favorites_;
        });
        ipcRenderer.send('askFavorites');
    }

    _isFavorite(li_,isfav)
    {
        
        let img = li_.getElementsByTagName('img');
        if(isfav==true)
        {
            img[1].src = "./img/favorite_black_48dp.svg";
            li_.setAttribute('isFav',true);
        }
        else
        {
            img[1].src = "./img/favorite_border_black_48dp.svg";
            li_.setAttribute('isFav',false);
        }
    }

    _fillStation(li_,station_)
    {
        let img = li_.getElementsByTagName('img');
        let uuid= station_.stationuuid;
        img[0].src= station_.favicon;
        let spans = li_.getElementsByTagName('span');
        spans[0].innerText = station_.name;
        spans[1].innerText = station_.tags.replace(',',', ');

        if(station_.stationuuid == undefined)
        {
            uuid = station_.uuid;
        }
        
        this._isFavorite(li_,false);
        for(let i =0;i< this._favorites.length;i++)
        {
            if(uuid == this._favorites[i].stationuuid)
            {
                this._isFavorite(li_,true);
                break;
            }
        }

        img[2].addEventListener('click',(e_)=>{
            event.stopPropagation();
            if(station_.homepage!="")
            {
                ipcRenderer.send('openurl',station_.homepage);
            }
            else
            {
                alert('no home page');
            }
        });
        
        img[1].addEventListener('click',(e_)=>{
            event.stopPropagation();
            let isFav = li_.getAttribute('isFav');
            ipcRenderer.send('askFavorites');
            if(isFav == "true")
            {
                console.log('remove');
                ipcRenderer.send('removeFavorite',station_);
                this._isFavorite(li_,false);
                
            }
            else
            {
                console.log('add');
                ipcRenderer.send('addFavorite',station_);
                this._isFavorite(li_,true);
            }
        });

        li_.addEventListener('click',(e_)=>{
            console.log(station_);
            g_player.play(station_);
        })

    }

    create(station_)
    {
        let liclone = this._li.cloneNode(true);
        this._fillStation(liclone,station_);
        return liclone;
    }

}

module.exports = stationVM;