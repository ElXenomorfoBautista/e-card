import { inject, Getter } from '@loopback/core';
import { BelongsToAccessor, repository } from '@loopback/repository';
import { AuthenticationBindings } from 'loopback4-authentication';

import { PgdbDataSource } from '../datasources';
import { CardBusinessHour, CardBusinessHourRelations, Card } from '../models';
import { AuthUser } from '../modules/auth';
import { DefaultUserModifyCrudRepository } from './default-user-modify-crud.repository.base';
import { CardRepository } from './card.repository';

export class CardBusinessHourRepository extends DefaultUserModifyCrudRepository<
    CardBusinessHour,
    typeof CardBusinessHour.prototype.id,
    CardBusinessHourRelations
> {
    public readonly card: BelongsToAccessor<Card, typeof CardBusinessHour.prototype.id>;

    constructor(
        @inject('datasources.pgdb') dataSource: PgdbDataSource,
        @inject.getter(AuthenticationBindings.CURRENT_USER)
        protected readonly getCurrentUser: Getter<AuthUser | undefined>,
        @repository.getter('CardRepository')
        getCardRepository: Getter<CardRepository>
    ) {
        super(CardBusinessHour, dataSource, getCurrentUser);

        this.card = this.createBelongsToAccessorFor('card', getCardRepository);
        this.registerInclusionResolver('card', this.card.inclusionResolver);
    }

    // Obtener horarios por card ID
    async findByCardId(cardId: number): Promise<CardBusinessHour[]> {
        return this.find({
            where: { cardId },
            order: ['dayOfWeek ASC'],
        });
    }

    // Obtener horario de un día específico
    async findByDay(cardId: number, dayOfWeek: number): Promise<CardBusinessHour | null> {
        return this.findOne({
            where: { cardId, dayOfWeek },
        });
    }

    // Crear horarios por defecto (lunes a viernes 9-17, fin de semana cerrado)
    async createDefaultSchedule(cardId: number): Promise<CardBusinessHour[]> {
        const defaultHours = [];

        for (let day = 0; day <= 6; day++) {
            const isWeekend = day === 0 || day === 6;

            defaultHours.push(
                await this.create({
                    cardId,
                    dayOfWeek: day,
                    openTime: isWeekend ? undefined : '09:00',
                    closeTime: isWeekend ? undefined : '17:00',
                    isClosed: isWeekend,
                    notes: isWeekend ? 'Cerrado' : 'Horario normal',
                })
            );
        }

        return defaultHours;
    }
}
