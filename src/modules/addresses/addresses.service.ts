import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto, UpdateAddressDto } from './dto';

@Injectable()
export class AddressesService {
  private readonly MAX_ADDRESSES = 5;

  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async create(userId: string, createAddressDto: CreateAddressDto): Promise<Address> {
    // Check address limit
    const count = await this.addressRepository.count({ where: { userId } });
    if (count >= this.MAX_ADDRESSES) {
      throw new BadRequestException(
        `Bạn chỉ có thể lưu tối đa ${this.MAX_ADDRESSES} địa chỉ`,
      );
    }

    // If setting as default, unset other defaults
    if (createAddressDto.isDefault) {
      await this.unsetAllDefaults(userId);
    }

    // If this is the first address, auto set as default
    const isFirstAddress = count === 0;

    const address = this.addressRepository.create({
      ...createAddressDto,
      userId,
      isDefault: createAddressDto.isDefault || isFirstAddress,
    });

    return await this.addressRepository.save(address);
  }

  async findAll(userId: string): Promise<Address[]> {
    return await this.addressRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id, userId },
    });

    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }

    return address;
  }

  async findDefault(userId: string): Promise<Address | null> {
    return await this.addressRepository.findOne({
      where: { userId, isDefault: true },
    });
  }

  async update(
    id: string,
    userId: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.findOne(id, userId);

    // If setting as default, unset other defaults
    if (updateAddressDto.isDefault) {
      await this.unsetAllDefaults(userId);
    }

    Object.assign(address, updateAddressDto);
    return await this.addressRepository.save(address);
  }

  async setDefault(id: string, userId: string): Promise<Address> {
    const address = await this.findOne(id, userId);

    // Unset all other defaults
    await this.unsetAllDefaults(userId);

    // Set this one as default
    address.isDefault = true;
    return await this.addressRepository.save(address);
  }

  async remove(id: string, userId: string): Promise<void> {
    const address = await this.findOne(id, userId);

    // If removing default address, set another as default
    if (address.isDefault) {
      const addresses = await this.findAll(userId);
      const otherAddress = addresses.find((a) => a.id !== id);
      if (otherAddress) {
        otherAddress.isDefault = true;
        await this.addressRepository.save(otherAddress);
      }
    }

    await this.addressRepository.remove(address);
  }

  private async unsetAllDefaults(userId: string): Promise<void> {
    await this.addressRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );
  }
}
