const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstname = user.name.split(' ')[0];
        this.url = url;
        this.from = `Jonas Schmedtmann <${process.env.EMAIL_FROM}>`;
    }

    makeTransport() {
        if(process.env.NODE_ENV === 'production') {
            // Sendgrid
            //Sendinblue
            return nodemailer.createTransport({
                service: 'SendinBlue',
                auth:{
                    user: process.env.SENDINBLUE_USERNAME,
                    pass: process.env.SENDINBLUE_PASSWORD
                }
            })
            // return 1;
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
            // Activate in gmail "less secure app" option
        })
    }

    // Send the actual email
    async send(template, subject){
        // 1) Render HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });
        // 2) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html)
        };
        // 3) Create a transport and send email
        await this.makeTransport().sendMail(mailOptions);
    }

    async sendWelcome(){
        // await this.send('welcome', 'Welcome to the Natours Family!');
    }

    async sendPasswordReset() {
        // await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)');
    }
};
