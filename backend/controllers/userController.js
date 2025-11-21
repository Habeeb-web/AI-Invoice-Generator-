const User = require('../models/User');

exports.updateUserProfile = async (req, res) => {
  try {
    console.log('=== PROFILE UPDATE REQUEST ===');
    console.log('req.user:', req.user);
    console.log('req.body:', req.body);

    // Safety check: Ensure req.user exists
    if (!req.user) {
      console.error('❌ req.user is undefined!');
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Find user by ID
    const user = await User.findById(req.user._id);

    // Safety check: Ensure user exists in DB
    if (!user) {
      console.error('❌ User not found in database!');
      return res.status(404).json({ message: "User not found" });
    }

    console.log('✅ User found:', user._id);

    // Update fields safely - only if provided in request
    if (req.body.name !== undefined) {
      user.name = req.body.name;
    }
    if (req.body.email !== undefined) {
      user.email = req.body.email;
    }
    if (req.body.businessName !== undefined) {
      user.businessName = req.body.businessName;
    }
    if (req.body.phone !== undefined) {
      user.phone = req.body.phone;
    }
    if (req.body.address !== undefined) {
      user.address = req.body.address;
    }

    // Save updated user
    const updatedUser = await user.save();

    console.log('✅ Profile updated successfully');

    // Return response
    return res.json({ 
      success: true, 
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        businessName: updatedUser.businessName,
        phone: updatedUser.phone,
        address: updatedUser.address
      }
    });

  } catch (error) {
    console.error('❌ ERROR in updateUserProfile:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({ 
      message: error.message || 'Server error' 
    });
  }
};
