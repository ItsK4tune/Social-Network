import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserProfile } from "src/modules/profile/entities/user-profile.entity";

@Injectable()
export class UserProfileUtil{
    constructor(
        @InjectRepository(UserProfile) private readonly repo: Repository<UserProfile>,
    ) {}

    getProfileByUsernameOrEmail (username: string, email: string) {
        return this.repo.findOne({ 
            where: [{ username }, { email }] 
        });
    }

    async save (userProfile: UserProfile) {
        await this.repo.save(userProfile);
    }
}