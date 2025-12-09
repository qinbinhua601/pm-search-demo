import { Schema } from 'prosemirror-model'
import { schema } from 'prosemirror-schema-basic'

let nodes = schema.spec.nodes

export const mySchema = new Schema({
  nodes,
  marks: schema.spec.marks
})