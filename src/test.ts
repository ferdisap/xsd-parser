import { parseXsdSchema } from "./core/parser";
// import { complexTypePlugin } from "./plugins/complexType";
// import { refPlugin } from "./plugins/ref";
// import { choicePlugin } from "./plugins/choice";

const xsdExample = `
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="library">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="book" type="BookType" maxOccurs="unbounded"/>
        <xs:element ref="identAndStatusSection"/>
        <xs:element ref="levelledPara"/>
        <xs:choice>
          <xs:element name="note" type="xs:string"/>
          <xs:element name="warning" type="xs:string"/>
        </xs:choice>
      </xs:sequence>
    </xs:complexType>
  </xs:element>

  <xs:simpleType name="ColorType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="red"/>
      <xs:enumeration value="green"/>
      <xs:enumeration value="blue"/>
    </xs:restriction>
  </xs:simpleType>

  <xs:attribute name="color" type="ColorType" default="red"/>
  
  <xs:attribute name="version" type="xs:string" fixed="1.0"/>

  <xs:complexType name="BookType">
    <xs:sequence>
      <xs:element name="title" type="xs:string"/>
    </xs:sequence>
    <xs:attribute ref="color"/>
    <xs:attribute name="year" type="xs:string" default="2020"/>
  </xs:complexType>

  <xs:element name="levelledPara" type="levelledParaElemType"/>

  <xs:complexType name="levelledParaElemType">
        <xs:sequence>
            <xs:sequence minOccurs="0">
                <xs:group minOccurs="0" ref="headingElemGroup"/>
                <xs:group minOccurs="0" ref="normalParaElemGroup"/>
            </xs:sequence>
            <xs:choice maxOccurs="unbounded" minOccurs="0">
                <xs:element ref="levelledPara"/>
                <xs:element ref="levelledParaAlts"/>
            </xs:choice>
        </xs:sequence>
        <xs:attribute ref="applicRefId"/>
        <xs:attribute ref="warningRefs"/>
        <xs:attribute ref="cautionRefs"/>
        <xs:attribute ref="id"/>
        <xs:attributeGroup ref="changeAttGroup"/>
        <xs:attributeGroup ref="securityAttGroup"/>
        <xs:attribute ref="controlAuthorityRefs"/>
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
  const schema = await parseXsdSchema(xsdExample);

  console.log("Parsed schema:");
  console.dir(schema, { depth: null });
}

runTest().catch(console.error);
