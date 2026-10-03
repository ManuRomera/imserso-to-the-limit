/**
 * Modelos de datos. Sin template.json: cada tipo declara su esquema aquí.
 * Las rutas (system.datos.*, system.atributos.*, …) son las de la v1 a propósito: los mundos
 * existentes y el módulo «Los Abuelos de la Justicia» escriben en ellas.
 */
import { IMSERSO } from "./config.mjs";
import { UMBRALES } from "./reglas.mjs";

const { StringField, NumberField, BooleanField, SchemaField, ArrayField, ObjectField } = foundry.data.fields;

const texto = (initial = "") => new StringField({ required: true, blank: true, initial });
const entero = (initial = 0, min, max) => new NumberField({ required: true, nullable: false, integer: true, initial, min, max });
const si = (initial = false) => new BooleanField({ required: true, initial });
const eleccion = (opciones, initial) => new StringField({ required: true, blank: true, initial, choices: Object.keys(opciones) });

const atributos = (initial = {}) => new SchemaField(Object.fromEntries(
  Object.keys(IMSERSO.atributos).map(k => [k, entero(initial[k] ?? 0)])
));
const habilidades = () => new SchemaField(Object.fromEntries(
  Object.keys(IMSERSO.habilidades).map(k => [k, new SchemaField({ dados: entero(1, 1, 3) })])
));
const par = (valor, max) => new SchemaField({ valor: entero(valor), max: entero(max) });

/** Datos antiguos: habilidades como número suelto o con dados fuera de 1-3. */
function migrarComun(datos) {
  const hab = datos.habilidades;
  if (hab && typeof hab === "object") {
    for (const [k, v] of Object.entries(hab)) {
      const d = Number(v?.dados ?? v);
      hab[k] = { dados: Math.min(3, Math.max(1, Number.isFinite(d) ? d : 1)) };
    }
  }
  return datos;
}

export class JubiladoData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      datos: new SchemaField({
        jugador: texto(), lugarNacimiento: texto(), anos: texto(), antiguaProfesion: texto(), partido: texto(),
        familiaNietos: texto(), arquetipo: texto(), arquetipoKey: texto(), arquetipoBase: texto(),
        trajeHeroico: texto(), estadoAventura: texto(), talento: texto(), vidaMilagros: texto(),
        pertenencias: texto(), relaciones: texto()
      }),
      atributos: atributos({ gra: 2, pre: 4, rob: 6 }),
      habilidades: habilidades(),
      salud: par(18, 18),
      jamacuco: new SchemaField({
        valor: entero(10),
        primeraTirada: si(),
        umbrales: new SchemaField(Object.fromEntries(UMBRALES.map(u => [u, si()])))
      }),
      yayopoints: new SchemaField({ valor: entero(4, 0), inicial: entero(4, 0) }),
      achaques: new SchemaField({ mayor: texto(), menor: texto(), menorUsado: si() }),
      flashback: new SchemaField({ usado: si(), nota: texto() }),
      combate: new SchemaField({
        armaIniciativa: eleccion(IMSERSO.ataqueTipos, "sinArmas"),
        ataque: eleccion(IMSERSO.ataqueTipos, "sinArmas"),
        sorprendido: si(),
        reservando: si(),
        accionExtra: si(),
        refuerzoBemoles: entero(0, 0),
        refuerzoNervio: entero(0, 0)
      }),
      estado: new SchemaField({ inconsciente: si(), muerto: si(), cogorza: si(), cadera: si(), notas: texto() }),
      curaciones: new SchemaField({
        dia: new ArrayField(texto()),
        sesion: new ArrayField(texto())
      })
    };
  }

  static migrateData(datos) {
    return super.migrateData(migrarComun(datos));
  }
}

export class ExtraData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      descripcion: texto(), bando: texto(), rol: texto(),
      atributos: atributos(),
      habilidades: habilidades(),
      salud: par(10, 10),
      bemoles: new SchemaField({ valor: entero(7), manual: si() }),
      nervio: new SchemaField({ valor: entero(3), manual: si() }),
      ataque: new SchemaField({
        nombre: texto("Tollina"), habilidad: eleccion(IMSERSO.habilidades, "tollinas"),
        tipo: eleccion(IMSERSO.ataqueTipos, "sinArmas"), dano: entero(2, 0)
      }),
      combate: new SchemaField({ sorprendido: si(), reservando: si(), accionExtra: si(), refuerzoBemoles: entero(0, 0), refuerzoNervio: entero(0, 0) }),
      estado: new SchemaField({ muerto: si(), notas: texto() }),
      notas: texto()
    };
  }

  static migrateData(datos) {
    return super.migrateData(migrarComun(datos));
  }
}

/** Campos comunes de los objetos que se pueden usar (equipo y talento). */
const uso = () => ({
  descripcion: texto(), equipado: si(), automatismo: texto(), habilidadUso: texto(), dificultadUso: entero(8, 0)
});

export class EquipoData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...uso(), cantidad: entero(1, 0), uso: texto(),
      // Los escribe el módulo de aventura; se conservan para no perderlos.
      categoria: texto(), equipable: si(), usable: si(true), modificadores: new ObjectField()
    };
  }
}

export class ArmaData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      tipo: eleccion(IMSERSO.ataqueTipos, "sinArmas"),
      habilidad: eleccion(IMSERSO.habilidades, "tollinas"),
      danoBase: entero(2, 0),
      atributoDano: eleccion(IMSERSO.atributos, "rob"),
      iniciativa: entero(0, 0),
      descripcion: texto(), equipado: si(), automatismo: texto(), equipable: si(true)
    };
  }
}

export class TalentoData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return { ...uso(), usos: par(1, 1) };
  }
}

export class ArquetipoData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      arquetipoKey: texto(), genero: texto(), partido: texto(),
      atributos: new ObjectField(), habilidades: new ObjectField(),
      habilidades3d: new ArrayField(texto()), habilidades2d: new ArrayField(texto()),
      yayopoints: entero(0, 0), saludBase: entero(0, 0), jamacuco: entero(0, 0),
      talentoNombre: texto(), talento: texto(), descripcion: texto()
    };
  }
}

export const MODELOS_ACTOR = { jubilado: JubiladoData, extra: ExtraData };
export const MODELOS_ITEM = { equipo: EquipoData, arma: ArmaData, talento: TalentoData, arquetipo: ArquetipoData };
