const nodemailer = require("nodemailer");


// Your code to handle binary data

module.exports = class MailSender {
  constructor({ host, name, port, user, pass }) {
    this.user = user;
    
    this.transporter = nodemailer.createTransport({
      host: host,
      name: name,
      port: port,
      secure: true,
      auth: {
        user: user,
        pass: pass,
      },
    });
  }
  async sendMail({ to, subject, html }) {
    const mailOptions = {
      from: this.user,
      to,
      subject,
      html,
//       attachments: [
//         {
//             // filename: 'file-name.pdf', // <= Here: made sure file name match
//             // path: path.join(__dirname, './ARUNACHALAM (Resume).pdf'), // <= Here
//             // contentType: 'application/pdf'
//             filename: 'your.pdf',
// content: bin, //EncodedString
// encoding: 'base64'
//         }
//     ]
    };
    await new Promise((resolve, reject) => {
      this.transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          reject(error);
          return error;
        } else {
          resolve(info);
        }
      });
    });
  }
};