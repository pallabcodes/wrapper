import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @MessagePattern('createProfile')
  create(@Payload() createProfileDto: CreateProfileDto) {
    return this.profileService.create(createProfileDto);
  }

  @MessagePattern('findAllProfile')
  findAll() {
    return this.profileService.findAll();
  }

  @MessagePattern('findOneProfile')
  findOne(@Payload() id: number) {
    return this.profileService.findOne(id);
  }

  @MessagePattern('updateProfile')
  update(@Payload() updateProfileDto: UpdateProfileDto) {
    return this.profileService.update(updateProfileDto.id, updateProfileDto);
  }

  @MessagePattern('removeProfile')
  remove(@Payload() id: number) {
    return this.profileService.remove(id);
  }
}
