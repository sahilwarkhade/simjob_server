import axios from "axios";

export const getAccessToken = async (code) => {
  const response = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
    },
    {
      headers: { Accept: "application/json" },
    }
  );

  const { access_token } = response.data;
  if (!access_token) {
    throw new Error("Failed to retrieve access token.");
  }

  return access_token;
};

export const getPrimaryEmail = async (access_token) => {
  const userEmailsResponse = await axios.get(
    "https://api.github.com/user/emails",
    {
      headers: { Authorization: `token ${access_token}` },
    }
  );
  const primaryEmail = userEmailsResponse.data.find(
    (email) => email.primary
  ).email;

  if (!primaryEmail) {
    throw new Error("Could not retrieve primary email from GitHub.");
  }

  return primaryEmail;
};

export const getUserProfile = async (access_token) => {
  const userProfileResponse = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `token ${access_token}` },
  });
  const profile = userProfileResponse.data;
  if(!profile){
    throw new Error("Unable to find user profile")
  }

  return profile;
};
