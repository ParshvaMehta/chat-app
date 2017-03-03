var nodemailer = require('nodemailer');

module.exports.sendMail = function(to, subject, text) {
    console.log("Mail Sending!");
    this.to = to;
    this.subject = subject;
    this.text = text;
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'test.parshva@gmail.com',
            pass: 'test@parshva'
        }
    });
    // setup email data with unicode symbols
    let mailOptions = {
        from: 'test.parshva@gmail.com', // sender address
        to: this.to, // list of receivers
        subject: this.subject, // Subject line
        //text: this.text, // plain text body
        html: this.text // html body
    };
    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
    });
};