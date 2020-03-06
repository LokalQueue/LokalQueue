var express = require('express');
var request = require('request');
var cors = require('cors');
const bodyParser = require('body-parser');
var querystring = require ('querystring');
var cookieParser = require('cookie-parser');
const fs = require('fs');
let songs = [];
var client_id = '6460035cffcb46ba9ded3329c1e37775';
var client_secret = 'ed651de623fa4722997307262f752c8c';
var redirect_uri = 'http://localhost:8888/callback/';
var app = express();
var tokenuse = null;
let did =[];
let playing = false;
const jsdom = require('jsdom');
const {JSDOM} = jsdom;
const dom = new JSDOM(``,{
    url: "http://localhost:8888",
    contentType: "text/html"
})

var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};
app.use(express.static(__dirname+'/public'))
    .use(cors())
    .use(cookieParser());
var stateKey = 'spotify_auth_state';
app.get('/login', function(req, res) {

    var state = generateRandomString(16);
    res.cookie(stateKey, state);
    var scope = 'user-read-private user-read-email playlist-modify-private streaming user-modify-playback-state user-read-playback-state';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

app.get('/callback', function(req, res) {

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {

                var access_token = body.access_token,
                    refresh_token = body.refresh_token;
                tokenuse = access_token;

                var options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true
                };

                // use the access token to access the Spotify Web API
                request.get(options, function(error, response, body) {
                    var userid = body.id;

                });

                res.redirect('/#' +
                    querystring.stringify({
                        access_token: access_token,
                        refresh_token: refresh_token
                    }));
            } else {
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            }
        });
    }
});

app.get('/refresh_token', function(req, res) {

    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };

    request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            var access_token = body.access_token;
            res.send({
                'access_token': access_token
            });
        }
    });
});
app.put('/rateup/:id',function (req,res) {
    var idx = 0;
    let id = req.params.id;
    console.log(id);
    while(idx<songs.length){
        console.log(songs[idx].id);

        if(songs[idx].id == id){
            var rate =songs[idx].rating;
            console.log(rate);
            var up = rate+1;
            songs[idx].rating = up;
        }
        idx++;
    }
    res.send("Rated up")
});
app.put('/ratedown/:id',function (req,res) {
    var idx = 0;
    let id = req.params.id;
    console.log(id);
    while(idx<songs.length){
        console.log(songs[idx].id);

        if(songs[idx].id == id){
            var rate =songs[idx].rating;
            console.log(rate);
            var up = rate-1;
            songs[idx].rating = up;
        }
        idx++;
    }
    res.send("Rated down")
});
app.get('/start',function (req,res) {
    if(songs.length>0) {
        playing = true;
        let show = did[0];
        let s = songs[0];
        var option = {
            url: 'https://api.spotify.com/v1/me/player/play?device_id=' + show.did,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + tokenuse,
            },
            json: {uris: ["spotify:track:"+s.id]}

        }
        request.put(option, function (error, response, body) {
            if (error) {
                console.log(error);
            }
        });
        if(songs.length>1){
            let i= 1;
            while(songs.length>i){
                let s2= songs[i];
                var option2 = {
                    url: "https://api.spotify.com/v1/me/player/add-to-queue?uri=spotify:track:"+s2.id+"&device_id="+show.did,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + tokenuse,
                    }
                }
                request.post(option2,function (error,response,body) {
                    if(error){
                        console.log(error);
                    }
                });
                i++;
            }
        }
    }
    else{
        console.log("There is no song added");
    }
});
app.use(bodyParser.urlencoded({extend:false}));
app.use(bodyParser.json());
app.post('/song',function (req,res) {
    if(playing == false) {
        console.log(req.body);
        var SongId = req.body;
        let exists = false;
        for(idx=0;idx<songs.length;idx++){
            if(SongId.id == songs[idx].id){
                exists = true;
            }
        }
        if(exists == false){
            songs.push(SongId);
            res.send("Added in");
        }
        else{
            console.log("Song already exists");
            res.send("Already exists");
        }
    }
    else{
        let show = did[0];
        let s = req.body.id;
        var option = {
            url: "https://api.spotify.com/v1/me/player/add-to-queue?uri=spotify:track:"+s+"&device_id="+show.did,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + tokenuse,
            }
        }
        request.post(option,function (error,response,body) {
            if(error){
                console.log(error);
            }
        });
        let exists = false;
        for(idx=0;idx<songs.length;idx++){
            if(s == songs[idx].id){
                exists = true;
            }
        }
        if(exists == false){
            res.send("Added in while playing");
            songs.push(req.body)
        }
        else{
            console.log("Song already exists");
            res.send("Already exists");
        }

    }
});
app.post('/did',function (req,res) {
    if(did.length<1) {
        console.log(req.body);
        var d = req.body;
        did.push(d);
        res.send("Playback Ready");
    }
});
app.get('/getdid',function (req,res) {
    res.json(did);
})
app.get('/songs',function (req,res) {

    res.json(songs);
});
app.delete('/songs/:id',function (req,res) {
    var idx = 0;
    let id = req.params.id;
    console.log(id);
    while(idx<songs.length){

        if(songs[idx].id == id){
           songs.splice(idx,1);
        }
        idx++;
    }
   res.end();
});

console.log('Listening on localhost 8888');
app.listen(8888);