import { parseXsdSchema } from "./core/parser";
import { complexTypePlugin } from "./plugins/complexType";
import { refPlugin } from "./plugins/ref";
import { choicePlugin } from "./plugins/choice";

const xsdExample = `
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="library">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="book" type="BookType" maxOccurs="unbounded"/>
        <xs:element ref="identAndStatusSection"/>
        <xs:choice>
          <xs:element name="note" type="xs:string"/>
          <xs:element name="warning" type="xs:string"/>
        </xs:choice>
      </xs:sequence>
    </xs:complexType>
  </xs:element>

  <xs:complexType name="BookType">
    <xs:sequence>
      <xs:element name="title" type="xs:string"/>
      <xs:element name="author" type="xs:string"/>
    </xs:sequence>
    <xs:attribute name="year" type="xs:string"/>
  </xs:complexType>

  <xs:element name="identAndStatusSection">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="id" type="xs:string"/>
        <xs:element name="status" type="xs:string"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>
`;

async function runTest() {
  const schema = await parseXsdSchema(xsdExample, {
    plugins: [complexTypePlugin(), refPlugin(), choicePlugin()],
  });

  console.log("Parsed schema:");
  console.dir(schema, { depth: null });
}

runTest().catch(console.error);
