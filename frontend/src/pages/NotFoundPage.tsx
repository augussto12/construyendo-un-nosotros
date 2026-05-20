import Button from '../components/Button'
import PageHeader from '../components/PageHeader'
import Seo from '../components/Seo'

export default function NotFoundPage() {
  return (
    <>
      <Seo title="Pagina no encontrada" description="La pagina solicitada no existe." />
      <PageHeader
        title="Pagina no encontrada"
        description="El contenido solicitado no esta disponible en esta version del sitio."
      />
      <section className="container-page py-14">
        <Button to="/" variant="secondary">
          Volver al inicio
        </Button>
      </section>
    </>
  )
}
