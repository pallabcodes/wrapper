import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MultiRegionService } from './services/multi-region.service';
import { RegionManagerService } from './services/region-manager.service';
import { DataReplicationService } from './services/data-replication.service';
import { LoadBalancerService } from './services/load-balancer.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    MultiRegionService,
    RegionManagerService,
    DataReplicationService,
    LoadBalancerService
  ],
  exports: [
    MultiRegionService,
    RegionManagerService,
    DataReplicationService,
    LoadBalancerService
  ]
})
export class MultiRegionModule {}
