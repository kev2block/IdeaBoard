const fs = require('fs');
const https = require('https');
const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;
const allowedUsers = process.env.ALLOWED_USERS.split(',');

app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..')));

app.get('/api/login', (req, res) => {
  const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=user:read:email`;
  res.redirect(twitchAuthUrl);
});

app.get('/api/callback', async (req, res) => {
  const code = req.query.code;

  try {
    const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      }
    });

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const user = userResponse.data.data[0];

    if (allowedUsers.includes(user.login)) {
      res.cookie('twitch_user', user.login, { maxAge: 900000, httpOnly: true });
      res.redirect('/');
    } else {
      res.send('Access denied');
    }
  } catch (error) {
    res.send('Error during authentication');
  }
});

app.get('/api/check-login', (req, res) => {
  const user = req.cookies.twitch_user;
  if (user && allowedUsers.includes(user)) {
    res.send(user);
  } else {
    res.status(403).send('Forbidden');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
