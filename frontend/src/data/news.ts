import { media } from './site'
import type { NewsItem } from '../types'

export const news: NewsItem[] = [
  {
    id: 'cumplimos-un-ano',
    slug: 'cumplimos-un-ano',
    title: 'Cumplimos Un Año',
    dateLabel: '22 de diciembre de 2025',
    category: 'Institucional',
    imageUrl: media.anniversary,
    sourceUrl: 'https://construyendounosotros.org/cumpleanos1/',
    excerpt:
      'Una celebracion institucional por el primer ano del Centro Deportivo, Social y Cultural Mar del Plata - Batan.',
    content: [
      'El sitio actual destaca esta noticia como contenido principal de inicio. El material definitivo debe completarse con fotos, video y cronica aprobada por la fundacion.',
      'TODO: reemplazar este texto por la nota final, incluyendo detalle de actividades, agradecimientos y registro audiovisual.',
    ],
    isTodo: true,
  },
  {
    id: 'inauguracion-centro',
    slug: 'inauguracion-centro-deportivo-social-cultural',
    title:
      'Con presencia de Javier Zanetti, se inauguro el Centro Deportivo, Social y Cultural Mar del Plata-Batan',
    category: 'Institucional',
    excerpt:
      'Nota detectada en la seccion Noticias del sitio actual. Pendiente migrar cuerpo completo y galeria.',
    sourceUrl:
      'https://construyendounosotros.org/con-presencia-de-javier-zanetti-se-inauguro-el-centro-deportivo-social-y-cultural-mar-del-plata-batan/',
    content: [
      'TODO: migrar texto completo, imagen destacada y recursos audiovisuales desde el sitio actual o backoffice futuro.',
    ],
    isTodo: true,
  },
  {
    id: 'torneo-futbol-mixto',
    slug: 'torneo-de-futbol-mixto',
    title: 'Torneo de futbol mixto con el apoyo de empresas y organizaciones',
    category: 'Comunidad',
    excerpt:
      'Actividad deportiva vinculada al trabajo con empresas, organizaciones y la comunidad local.',
    sourceUrl:
      'https://construyendounosotros.org/torneo-de-futbol-mixto-con-el-apoyo-de-empresas-y-organizaciones/',
    content: ['TODO: completar cronica, fecha, fotos y participantes.'],
    isTodo: true,
  },
  {
    id: 'practicas-deportivas',
    slug: 'acuerdo-ees-33-ees-47-practicas-deportivas',
    title: 'Acuerdo con EES 33 y EES 47 para practicas deportivas',
    category: 'Alianzas',
    excerpt:
      'Acuerdo educativo-deportivo listado en Noticias. Pendiente ampliar con informacion institucional.',
    sourceUrl:
      'https://construyendounosotros.org/acuerdo-con-ees-33-y-ees-47-para-practicas-deportivas/',
    content: ['TODO: sumar descripcion del acuerdo, alcance y actores participantes.'],
    isTodo: true,
  },
  {
    id: 'vacaciones-invierno',
    slug: 'vacaciones-de-invierno-en-mar-del-plata',
    title: 'Vacaciones de Invierno en Mar del Plata',
    category: 'Comunidad',
    excerpt:
      'Registro de actividades comunitarias durante el receso invernal en Mar del Plata.',
    sourceUrl:
      'https://construyendounosotros.org/vacaciones-de-invierno-en-mar-del-plata/',
    content: ['TODO: completar texto, fecha y galeria.'],
    isTodo: true,
  },
  {
    id: 'avance-obra-general',
    slug: 'avance-de-obra-general',
    title: 'Avance de Obra General',
    category: 'Etapa Constructiva',
    excerpt:
      'Actualizacion general de obra detectada en el archivo de noticias del sitio actual.',
    sourceUrl: 'https://construyendounosotros.org/avance-de-obra-general/',
    content: ['TODO: migrar detalle del avance y material visual.'],
    isTodo: true,
  },
]

export const latestNews = news.slice(0, 3)
