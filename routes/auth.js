const express = require("express");

const router = express.Router();

async function Login(req, res) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    // Here, you would typically find or create a user in your database.
    // For this example, we're just returning a dummy JWT.

    const user = {
      id: sub,
      email,
      name,
      picture,
    };

    // Generate a JWT token for the user
    const jwtToken = jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Send response to the frontend
    res.json({
      message: "User authenticated successfully",
      token: jwtToken,
      user,
    });
  } catch (error) {
    console.error("Error during Google authentication:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

router.post("/google", Login);

module.exports = router;
