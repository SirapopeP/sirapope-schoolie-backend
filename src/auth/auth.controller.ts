import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { usernameOrEmail: string; password: string }) {
    const user = await this.authService.validateUser(
      loginDto.usernameOrEmail,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(
    @Body() registerDto: {
      email: string;
      username: string;
      password: string;
      fullName?: string;
      nickName?: string;
    }
  ) {
    return this.authService.register(registerDto);
  }
}