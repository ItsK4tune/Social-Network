import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { UserAccount } from './entities/user-account.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthenDTO } from './dtos/authen.dto';
import { UserAccountUtil } from 'src/modules/authen/user-account.util';
import { MailService } from './mail.service';
import { env } from 'src/config';

@Injectable()
export class AuthenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly userAccountUtil: UserAccountUtil,
  ) {}

  async createUser({ username, password }: AuthenDTO) {
    if (!username || !password)
      return 400;

    const findUser = await this.userAccountUtil.findByUsername(username);
    if (findUser) 
      return 409;

    const ecryptPassword = await bcrypt.hash(password, 12);

    const user = this.userAccountUtil.create(username, ecryptPassword);
    await this.userAccountUtil.save(user);
  }

  async validateUser({ username, email, password }: AuthenDTO) {
    if (username && email) return null;

    let findUser: UserAccount;
    if (username) {
      findUser = await this.userAccountUtil.findByUsername(username);
    }

    if (!findUser && email) {
      const userByEmail = await this.userAccountUtil.findByEmail(email);
      if (userByEmail?.verifyEmail) {
        findUser = userByEmail;
      }
    }

    if (!findUser) return null;

    if (await bcrypt.compare(password, findUser.password)) {
      const {
        password,
        profile,
        verifyEmail,
        created_at,
        updated_at,
        ...user
      } = findUser;
      return this.jwtService.sign(user);
    }

    return null;
  }

  async forgotPassword(email: string) {
    const user = await this.userAccountUtil.findByEmail(email);

    if (!user) 
      return 400;

    const payload = { email };
    const token = this.jwtService.sign(payload, { expiresIn: env.mailer.time });

    const resetLink = `${env.dns}/reset-password?token=${token}`;
    await this.mailService.sendMail({
      to: email,
      subject: 'Reset password',
      text: `Dear user,\n\nWe received a request to reset your password...`,
      html: `
                <h1>Dear user,</h1>
                <p>We received a request to reset your password. If you did not make this request, please ignore this email.</p>
                <p>To reset your password, click the link below:</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
                <p>This link will expire in <strong>${env.mailer.time}</strong> for security reasons.</p>
                <p>If you have any issues, please contact our support team.</p>
                <p>Best regards,<br>Your Website Team</p>
            `,
    });

    return;
  }

  async resetPassword(token: string, newPassword: string) {
      try {
          const decoded = this.jwtService.verify(token);
          const email = decoded.email;
      
          const user = await this.userAccountUtil.findByEmail(email);
          if (!user) 
            return 400;
      
          await this.userAccountUtil.updatePassword(user, newPassword);
      
          return;
      } catch (error) {
          return 409;
      }
  }

  async verifyEmail(email: string) {
    const user = await this.userAccountUtil.findByEmail(email);

    if (!user) 
      return 400;
    if (user.verifyEmail)
      return 409;

    const payload = { email };
    const token = this.jwtService.sign(payload, { expiresIn: env.mailer.time });

    const verifyLink = `${env.dns}/verify?token=${token}`;
    await this.mailService.sendMail({
      to: email,
      subject: 'Verify email',
      text: `Dear user,\n\nWe received a request to verify your email...`,
      html: `
                <h1>Dear user,</h1>
                <p>We received a request to verify your email. If you did not make this request, please ignore this email.</p>
                <p>To verify your email, click the link below:</p>
                <p><a href="${verifyLink}">${verifyLink}</a></p>
                <p>This link will expire in <strong>${env.mailer.time}</strong> for security reasons.</p>
                <p>If you have any issues, please contact our support team.</p>
                <p>Best regards,<br>Your Website Team</p>
            `,
    });

    return;
  }

  async verify(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const email = decoded.email;

      const user = await this.userAccountUtil.findByEmail(email);
      if (!user) 
        return 409;

      await this.userAccountUtil.updateVerifyEmail(user);

      return { message: 'Verified' };
    } catch (error) {
      return 400;
    }
  }
}
