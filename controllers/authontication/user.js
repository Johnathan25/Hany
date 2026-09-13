const UserModel = require(`../../models/User`);



// get profile
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await UserModel.findById(userId, "-password");

  
    if (!user) {
      return res.status(404).json({ message: "هذا المستخدم غير موجود!" });
    }

    res.status(200).json({
      message: "تم جلب المستخدم بنجاح",
      user
    });

  } catch (err) {
    res.status(500).json({
      message: "حدث خطأ أثناء جلب المستخدم: " + err.message
    });
  }
};


// update profile
exports.updateProfile=async(req,res)=>{
  try{
            const { userId } = req.user;
        if(!userId){
            return res.status(403).json({message:"من فضلك سجل الدخول اولا !"})
        }
    const { userName, email, address, phoneNumber } = req.body;

    const update = {};

    if (userName) update.userName = userName;
    if (email) update.email = email;
    if (address) update.address = address;
    if (phoneNumber) update.phoneNumber = phoneNumber;

    const query = { $set: update };



    const user = await UserModel.findByIdAndUpdate(
      userId,
      query,
      { new: true, runValidators: true }
    );


    if (!user) {
      return res.status(404).json({ message: "هذا المستخدم غير موجود!" });
    }

    res.status(200).json({
      message: "تم تعديل المستخدم بنجاح",
      user
    });

  }catch(err){
       res.status(500).json({
      message: "حدث خطأ أثناء تحديث المستخدم: " + err.message
    });
  }
}