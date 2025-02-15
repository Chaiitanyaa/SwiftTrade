const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const token = req.header("Authorization");

    if (!token) {
        return res.status(401).json({ success: false, data: { error: "Access denied. No token provided." } });
    }

    try {
        const tokenParts = token.split(" ");
        if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
            return res.status(400).json({ success: false, data: { error: "Invalid token format" } });
        }

        const decoded = jwt.verify(tokenParts[1], "your_secret"); // Decode JWT
		console.log("Decoded Token:", decoded); // Debugging: Check if ID is present

		if (!decoded.id) {
			return res.status(400).json({ success: false, data: { error: "Invalid token payload" } });
		}

		req.user = { id: decoded.id, user_name: decoded.user_name }; // Explicitly set user ID
		next();

    } catch (error) {
        return res.status(400).json({ success: false, data: { error: "Invalid token" } });
    }
};
