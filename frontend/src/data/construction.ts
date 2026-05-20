import { media } from './site'
import type { ConstructionStage } from '../types'

export const constructionStages: ConstructionStage[] = [
  {
    id: 'presentacion-2018',
    title: 'Presentacion del proyecto',
    period: '25 de julio de 2018',
    status: 'presented',
    imageUrl: media.solidarity,
    description:
      'Presentacion en Mar del Plata del proyecto Construyendo un Nosotros Mar del Plata - Batan.',
    items: [
      'Primer grupo de empresarios y personalidades locales sumados a la cadena de valor solidaria.',
      'Alianza de Fundacion PUPI con SOIP para impulsar el proyecto deportivo, social y cultural.',
    ],
  },
  {
    id: 'enero-2019',
    title: 'Etapas I, II y III',
    period: 'Enero 2019',
    status: 'in-progress',
    description:
      'Plan de avance constructivo para consolidar espacios deportivos, recreativos y de acompanamiento profesional.',
    items: [
      'Etapas I y II en terminacion.',
      'Sector recreativo al aire libre.',
      'Cancha de futbol / voley playa: 925 mts2.',
    ],
  },
  {
    id: 'canchas',
    title: 'Infraestructura deportiva',
    period: 'Avances de obra',
    status: 'completed',
    description:
      'Desarrollo de espacios deportivos para actividades comunitarias, recreativas y formativas.',
    items: [
      'Cancha de cesped sintetico de futbol 9.',
      'Transformable en 3 canchas de futbol 5 - 2400 mts2.',
      'Avances de luminaria y accesos principales.',
    ],
  },
  {
    id: 'servicios',
    title: 'Servicios y espacios de apoyo',
    period: 'Avances de obra',
    status: 'in-progress',
    description:
      'Construccion de areas complementarias para sostener la actividad cotidiana del predio.',
    items: [
      'Complejo de sanitarios, duchas y vestuarios - 80,6 mts2.',
      'Gastronomia y pasante - 200 mts2.',
      'Sala de maquinas y gabinetes de atencion profesional - 80,6 mts2.',
      'Salon de usos multiples - 153 mts2.',
    ],
  },
]
