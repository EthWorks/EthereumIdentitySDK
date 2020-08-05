import nodemailer, {SentMessageInfo} from 'nodemailer';
import {MailOptions} from 'nodemailer/lib/json-transport';
import Mail from 'nodemailer/lib/mailer';
import {CannotSendEmail} from '../../core/utils/errors';
import {confirmationEmailHtml} from '../../core/utils/confirmationEmailHtml';
import {getNameFromEmail} from '../../core/utils/getNameFromEmail';

export class EmailService {
  private transporter: Mail;
  constructor(private copyToClipboardUrl: string, private emailAddress: string, emailPassword: string, private emailLogo: string) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.emailAddress,
        pass: emailPassword,
      },
    });
  }

  async sendMail(mailOptions: MailOptions): Promise<SentMessageInfo> {
    try {
      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new CannotSendEmail(error.message);
    }
  }

  async sendConfirmationMail(email: string, code: string): Promise<SentMessageInfo> {
    const mailOptions = {
      from: `UniLogin <${this.emailAddress}>`,
      to: email,
      subject: '🎉 Verify your e-mail',
      html: confirmationEmailHtml({code: code, clipboardUrl: this.copyToClipboardUrl, logoUrl: this.emailLogo, userName: getNameFromEmail(email)}),
      replyTo: 'noreply@unilogin.eth',
    };
    return this.sendMail(mailOptions);
  }
}
