const express = require('express');

require('dotenv').config();

const app = express();

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set('trust proxy', true);

const cors = require('cors');
const bodyParser = require('body-parser');

app.use(cors({
  origin: true,
  credentials: true
}));


const config = require(`${__dirname}/config/configDB`);
const userRoute = require(`${__dirname}/routes/Auth`);
const websiteSettingRoute = require(`${__dirname}/routes/website/website`);
const { connectRedis } = require("./config/redis");


// MongoDB
config.connectDB(process.env.DATABASE);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use('/v1/users', userRoute);
app.use('/v1/websiteSettings', websiteSettingRoute);



const PORT = process.env.PORT || 5000;


// Start Server
const startServer = async () => {
  try {

    // Connect Redis
    await connectRedis();

    // Start Express
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();