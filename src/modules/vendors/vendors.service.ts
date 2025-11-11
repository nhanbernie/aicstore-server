import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './entity/vendor.schema';
import { VendorStatus } from '@enums/vendor-status.enum';
import {
  CreateVendorDto,
  UpdateVendorDto,
  AdminUpdateVendorDto,
} from './dto/vendor.dto';
import { UsersService } from '@users/users.service';
import { ROLE } from '@enums/auth.enums';
import { VendorWalletService } from '../vendor-wallet/vendor-wallet.service';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorsRepository: Repository<Vendor>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => VendorWalletService))
    private readonly vendorWalletService: VendorWalletService,
  ) { }

  async create(
    createVendorDto: CreateVendorDto,
    userId: string,
  ): Promise<Vendor> {
    const existingVendor = await this.findByUserId(userId);
    if (existingVendor) {
      throw new ConflictException('User already has a vendor profile');
    }

    // NOTE: User role remains as USER until admin approves
    // Role will be changed to VENDOR only when status is APPROVED

    const vendor = this.vendorsRepository.create({
      ...createVendorDto,
      userId,
      status: VendorStatus.PENDING,
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

  async update(
    id: string,
    updateVendorDto: UpdateVendorDto | AdminUpdateVendorDto,
    currentUserId: string,
    userRoles: string[],
  ): Promise<Vendor> {
    const vendor = await this.findById(id);

    // Check permissions: only admin or the vendor owner can update
    const isAdmin = userRoles.includes(ROLE.ADMIN);
    const isOwner = vendor.userId === currentUserId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'You can only update your own vendor profile',
      );
    }

    // Only admin can change status
    if ('status' in updateVendorDto && updateVendorDto.status && !isAdmin) {
      throw new ForbiddenException('Only admin can change vendor status');
    }

    Object.assign(vendor, updateVendorDto);
    return this.vendorsRepository.save(vendor);
  }

  async remove(id: string): Promise<void> {
    const vendor = await this.findById(id);

    await this.usersService.update(vendor.userId, { roles: [ROLE.USER] });

    await this.vendorsRepository.remove(vendor);
  }

  async approveVendor(id: string): Promise<Vendor> {
    const vendor = await this.findById(id);
    
    // Change user role to VENDOR when approved
    await this.usersService.update(vendor.userId, { roles: [ROLE.VENDOR] });
    
    vendor.status = VendorStatus.APPROVED;
    const savedVendor = await this.vendorsRepository.save(vendor);
    
    await this.vendorWalletService.createWallet(vendor.id);
    
    return savedVendor;
  }

  async rejectVendor(id: string): Promise<Vendor> {
    const vendor = await this.findById(id);
    
    // Keep user role as USER when rejected
    // If they were previously approved, change back to USER
    await this.usersService.update(vendor.userId, { roles: [ROLE.USER] });
    
    vendor.status = VendorStatus.REJECTED;
    return this.vendorsRepository.save(vendor);
  }

  async suspendVendor(id: string): Promise<Vendor> {
    const vendor = await this.findById(id);
    
    // Change user role back to USER when suspended
    await this.usersService.update(vendor.userId, { roles: [ROLE.USER] });
    
    vendor.status = VendorStatus.SUSPENDED;
    return this.vendorsRepository.save(vendor);
  }

  async getVendorsByStatus(status: VendorStatus): Promise<Vendor[]> {
    return this.vendorsRepository.find({
      where: { status },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
