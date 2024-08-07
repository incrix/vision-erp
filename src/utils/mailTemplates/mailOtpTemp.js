module.exports = textHtml = (OTP) => {
    return `
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email OTP Template</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 20px;
        text-align: center;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        margin-bottom: 20px;
      }
      .header img {
        width: 80px;
        margin-bottom: 10px;
      }
      .header h1 {
        font-size: 24px;
        color: #333333;
        margin: 0;
      }
      .content {
        font-size: 16px;
        color: #555555;
        margin-bottom: 30px;
      }
      .otp {
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 10px;
        color: #333333;
        margin: 20px 0;
      }
      .footer {
        font-size: 12px;
        color: #999999;
      }
      .footer a {
        color: #007bff;
        text-decoration: none;
      }
      .footer a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div style="text-align: center">
          <img
            style="width: 40px; height: 50px; padding: 0%; margin: 0%"
            src="https://upload.incrix.com/search?url=/file/MasterAcademy/image/file-1722704621540.png"
            alt="Slipze Logo"
          />
          <!-- <h1 style="display: inline-block;">Image</h1> -->
          <h1
            style="
              display: inline-block;
              font-size: 40px;
              height: 30px;
              margin-left: 10px;
            "
          >
            Slipze
          </h1>
        </div>

        <p>A product of Incrix Techlutions LLP</p>
      </div>
      <div class="content">
        <p>Here is your One Time Password (OTP).</p>
        <p>Please enter this code to verify your email address for Slipze</p>
        <div class="otp">
          <p
            style="
              font-size: 24px;
              display: inline-block;
             background-color: #F2F8FF;
              width: 50px;
              border-radius: 5px;
              margin-left: 5px;
              margin-right: 5px;
              height: 50px;
              text-align: center;
              line-height: 50px;
            "
          >
          ${OTP[0]}
          </p>

          <p
            style="
              font-size: 24px;
              display: inline-block;
            background-color:  #F2F8FF;
              width: 50px;
              border-radius: 5px;
              margin-left: 5px;
              margin-right: 5px;
              height: 50px;
              text-align: center;
              line-height: 50px;
            "
          >
          ${OTP[1]}
          </p>

          <p
            style="
              font-size: 24px;
              display: inline-block;
              background-color:  #F2F8FF;
              width: 50px;
              border-radius: 5px;
              margin-left: 5px;
              margin-right: 5px;
              height: 50px;
              text-align: center;
              line-height: 50px;
            "
          >
          ${OTP[2]}
          </p>

          <p
            style="
              font-size: 24px;
              display: inline-block;
              background-color:  #F2F8FF;
              width: 50px;
              border-radius: 5px;
              height: 50px;
              margin-left: 5px;
              margin-right: 5px;
              text-align: center;
              line-height: 50px;
            "
          >
          ${OTP[3]}
          </p>
          <p
            style="
              font-size: 24px;
              display: inline-block;
              background-color:  #F2F8FF;
              width: 50px;
              border-radius: 5px;
              height: 50px;
              margin-left: 5px;
              margin-right: 5px;
              text-align: center;
              line-height: 50px;
            "
          >
          ${OTP[4]}
          </p>
        </div>
        <!-- <p>OTP will expire in <strong>5 minutes</strong>.</p> -->
      </div>
      <div class="footer">
        <p>
          Best Regards,<br />
          <a href="#">Slipze team</a>.
        </p>
      </div>
    </div>
  </body>
</html>
`
}
