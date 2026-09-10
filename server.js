const express = require('express');

require('dotenv').config()
const app = express();



const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.set('trust proxy', true);
const cors =require('cors')
const bodyParser = require('body-parser');
app.use(cors({
  origin: true,
  credentials: true
}));


const config=require(`${__dirname}/config/configDB`);
const serviceRoutes=require(`${__dirname}/routes/serviceRoutes`);
const userRoute=require(`${__dirname}/routes/users/Auth`);
const admins =require(`${__dirname}/routes/users/admin`);
const paymentRoutes = require("./routes/paymentRoutes");
const serviceRequest = require("./routes/serviceRequest");

config.connectDB(process.env.DATABASE);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));






app.use('/v1/users',userRoute);
app.use('/v1/serviceMangement',serviceRoutes);
app.use('/v1/serviceRequests',serviceRequest);

app.use("/v1/admins",admins)
app.use("/api/webhooks", paymentRoutes);



const PORT=process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})
