const express = require(`express`);
const router=express.Router();
const authMiddleware = require(`${__dirname}/../../middlewares/authMiddleware`);
const usersController = require(`${__dirname}/../../controllers/authontication/auth`);
const usersController2 = require(`${__dirname}/../../controllers/authontication/user`);





// login route
router.post('/login', usersController.login);
router.post('/sign-up', usersController.signUp);


// refresh token
router.post('/refresh-token', usersController.refreshToken);

// reset password
router.put('/reset-password', usersController.resetPassword);

// forget password
router.put('/forgot-password', usersController.forgetPassword);

router.get('/profile', authMiddleware.protected, usersController2.getProfile);
router.put('/updateProfile',authMiddleware.protected, usersController2.updateProfile);


router.get('/:ID', usersController.getInfo);
// protected routes
router.use(authMiddleware.protected);

// logout
router.post('/logout', usersController.userLogout);
router.post('/auth', usersController.auth);




// update password
router.put('/update-password', usersController.updatePassword);

module.exports=router;