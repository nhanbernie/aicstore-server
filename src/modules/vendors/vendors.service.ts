import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './entity/vendor.schema';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { UsersService } from '@users/users.service';
import { ROLE } from '@enums/auth.enums';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorsRepository: Repository<Vendor>,
    private readonly usersService: UsersService,
  ) {}

  async create(createVendorDto: CreateVendorDto, userId: string): Promise<Vendor> {
    // Check if user already has a vendor profile
    const existingVendor = await this.findByUserId(userId);
    if (existingVendor) {
      throw new ConflictException('User already has a vendor profile');
    }

    // Update user role to vendor
    await this.usersService.update(userId, { roles: [ROLE.VENDOR] });

    const vendor = this.vendorsRepository.create({
      ...createVendorDto,
      userId,
      status: 'pending',
    });

    return this.vendorsRepository.save(vendor);
  }

  async findAll(): Promise<Vendor[]> {
    return this.vendorsRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Vendor> {
    const vendor = await this.vendorsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async findByUserId(userId: string): Promise<Vendor | null> {
    return this.vendorsRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async update(id: string, updateVendorDto: UpdateVendorDto, currentUserId: string, userRoles: string[]): Promise<Vendor> {
    const vendor = await this.findById(id);

    // Check permissions: only admin or the vendor owner can update
    const isAdmin = userRoles.includes(ROLE.ADMIN);
    const isOwner = vendor.userId === currentUserId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You can only update your own vendor profile');
    }

    // Only admin can change status
    if (updateVendorDto.status && !isAdmin) {
      throw new ForbiddenException('Only admin can change vendor status');
    }

    Object.assign(vendor, updateVendorDto);
    return this.vendorsRepository.save(vendor);
  }

  async remove(id: string): Promise<void> {
    const vendor = await this.findById(id);
    
    // Update user role back to USER when vendor is deleted
    await this.usersService.update(vendor.userId, { roles: [ROLE.USER] });
    
    await this.vendorsRepository.remove(vendor);
  }

  async approveVendor(id: string): Promise<Vendor> {
    const vendor = await this.findById(id);
    vendor.status = 'approved';
    return this.vendorsRepository.save(vendor);
  }

  async rejectVendor(id: string): Promise<Vendor> {
    const vendor = await this.findById(id);
    vendor.status = 'rejected';
    return this.vendorsRepository.save(vendor);
  }

  async suspendVendor(id: string): Promise<Vendor> {
    const vendor = await this.findById(id);
    vendor.status = 'suspended';
    return this.vendorsRepository.save(vendor);
  }

  async getVendorsByStatus(status: string): Promise<Vendor[]> {
    return this.vendorsRepository.find({
      where: { status },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
