import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import fs from 'fs'
import { dirname } from "path";
import { fileURLToPath } from "url";
import path from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));


const app = express();
const port = 3000;
const API_URL = "https://api.jikan.moe/v4";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

function searchForAnime(result) {
    // TITLES OF ANIME:
    var id = result.mal_id;
    var title = result.title;
    var title_japanese = result.title_japanese;
    var title_synonyms = result.title_synonyms[0];
    if (!title_synonyms) { title_synonyms = ''}

    // DESCRIPTION:
    var description = result.synopsis;

    //IMAGE FOR PAGE:
    var image = result.images.jpg.large_image_url;

    //IS TV MOVIE OR OVA. and IS IT AIRING OR FINISHED:
    var type = result.type; // TV / MOVIE
    var status = result.status; // finished airing
    var airing = result.airing; // "true / false"
    var score = result.score;
    var scored_by = result.scored_by;

    // WHAT GENRE THE SHOW IS
    var genres_ = result.genres;
    var themes = result.themes;
    var demographics = result.demographics;
    let genreslist = {
      genres  : genres_ ,
      themes : themes , 
      demographics : demographics
    };
    // concluding to a data list
    var data = {
      id: id,
      title: title,
      title_japanese : title_japanese,
      title_synonyms : title_synonyms,
      description: description,
      image: image,
      type: type,
      status: status,
      airing: airing,
      score: score,
      scored_by: scored_by,
    };
    return [data , genreslist];
  };

app.get("/", async (req, res) => {
  const result = await axios.get(`${API_URL}/random/anime`);
  try {
    console.log("____________Random Anime on load__________________")
    var [data , genres] = searchForAnime(result.data.data);
    res.render("index.ejs" , { data: data ,genres: genres});
  } catch (error) {
    // Log the error message
    console.error('Error:', error.message);

    // Render the EJS template and pass the error message
    res.status(500).render('index.ejs', {
      error: 'An error occurred while processing your request. Please try again later.'
    });
  }
});



app.get("/anime_list", async (req, res) => {
  
  try {
  const postsFilePath = path.join(__dirname, 'views','anime_list.json');
  fs.readFile(postsFilePath, 'utf8', (err, data) => {
      if (err) {
          return res.status(500).send('Error reading the posts file.');
      }

      const liked_animes = JSON.parse(data);
      console.log("------------------------------")
      console.log(liked_animes)
      
      if (!liked_animes) {
          return res.status(404).send('Post not found.');
      }

      // Render the edit form with the post data
      res.render('anime_list.ejs', { liked_animes});
  });
  
  } catch (error) {
    // Log the error message
    console.error('Error:', error.message);

    // Render the EJS template and pass the error message
    res.status(500).render('index.ejs', {
      error: 'An error occurred while processing your request. Please try again later.'
    });
  }
});



app.post("/", async (req, res) => {
// req params
const type_sent = req.body.type;
const genres_sent = req.body.genres;
const status_sent = req.body.status;
const min_score_sent = req.body.min_score;
const q_sent = req.body.q;
// query the params 
const queries_by_user = {
  ...(type_sent && { type: type_sent }),
  ...(genres_sent && { genres: genres_sent }),
  ...(status_sent && { status: status_sent }),
  ...(min_score_sent && { min_score: min_score_sent }),
  ...(q_sent && { q: q_sent })
};

// API call
let result = await axios.get(`${API_URL}/anime`, { params: queries_by_user });

  try {
    console.log("____________Random Anime on Search__________________")
    const dataArray = result.data.data;
      // Logs the first anime object
    let random_var = Math.floor(Math.random() * dataArray.length);
    result = dataArray[random_var]
    // TITLES OF ANIME:
    var [data , genres] = searchForAnime(result);

    res.render("index.ejs" , { data: data ,genres: genres});
  } catch (error) {
    // Log the error message
    console.error('Error:', error.message);

    // Render the EJS template and pass the error message
    res.status(500).render('index.ejs', {
      error: 'An error occurred while processing your request. Please try again later.'
    });
  }
  
  
});


app.post("/add-to-list", async (req, res) => {
  // req params
  const id_sent = req.body.id;
  const title_sent = req.body.title;
  const image_sent = req.body.img;
  const dis_sent = req.body.dis;
  // API call

  
    
  console.log("____________Add to list Anime on click__________________")
      // Path to posts.json
    const postsFilePath = path.join(__dirname, 'views','anime_list.json');

    // Read the existing anime_list.json file
    fs.readFile(postsFilePath, 'utf8', (err, data) => {
      if (err && err.code !== 'ENOENT') {
          return res.status(500).send('Error reading posts file.');
      }
  
      let anime_list = {};
  
      if (data.trim() !== '') {
          try {
              // Parse the JSON data
              anime_list = JSON.parse(data);
          } catch (parseError) {
              return res.status(500).send('Error parsing anime_list file.');
          }
      }
  
      if (anime_list[id_sent]) {
        var message  = 'Anime already exists in the list' ;
      } else {
        var message  ='Added anime to list successfully' ;
      }
      // Update or add the new post
      anime_list[id_sent] = {
          title: title_sent,
          img: image_sent ,
          dis: dis_sent
      };
  
      // Write the updated data back to the file
      fs.writeFile(postsFilePath, JSON.stringify(anime_list, null, 2), (err) => {
          if (err) {
              return res.status(500).send('Error writing anime_list file.');
          }
            res.json({ message: message });
      });
  });
  


    
  });








app.post("/show-from-list", async (req, res) => {
  // req params
  const id_sent = req.body.id;
  // API call
  let result = await axios.get(`${API_URL}/anime/`+id_sent);
  
    try {
      console.log("show from list Anime on click__________________")

      // TITLES OF ANIME:
      
      console.log(result.data.data)
      var [data , genres] = searchForAnime(result.data.data);
      res.render("index.ejs" , { data: data ,genres: genres});
    } catch (error) {
      // Log the error message
      console.error('Error:', error.message);
      
      // If using Axios, you might also want to log the response data
      if (error.response) {
        console.error('Response data:', error.response.data);
      } else {
        console.error('Error details:', error);
      }
    
      // Render the EJS template and pass the error message
      res.status(500).render('index.ejs', {
        error: 'An error occurred while processing your request. Please try again later.'
      });
    }
    
    
  });
  
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
