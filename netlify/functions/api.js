
exports.handler = async (event, context) => {
  try {
    // You would implement your actual API logic here
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "API is working!" }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" }),
    };
  }
};
