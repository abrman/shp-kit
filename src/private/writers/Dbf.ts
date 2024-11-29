import createDataView from "../helpers/createDataView";

type FieldMeta = {
  field_key: string;
  field_name: string;
  field_type: "C" | "N" | "L";
  field_length: number;
  field_decimal_length: number;
};

type Properties = { [key: string]: string | number | boolean | object | any[] }[];

const truncateByByteLength = (input: string, maxLength: number) => {
  if (new TextEncoder().encode(input).length < maxLength) return input;
  let byteCount = 0;
  let result = "";
  for (const char of input) {
    const charLength = new TextEncoder().encode(char).length;
    if (byteCount + charLength > maxLength) break;
    byteCount += charLength;
    result += char;
  }

  return result;
};
const formatStringField = (input: string, len: number) => {
  const truncatedString = truncateByByteLength(input, len);
  const remainingSpaces = Math.max(0, len - new TextEncoder().encode(truncatedString).length);
  return truncatedString + " ".repeat(remainingSpaces);
};

const formatNumField = (input: number, len: number, decimalSpaces: number) => {
  const formattedNumber = input.toFixed(decimalSpaces);
  const remainingSpaces = Math.max(0, len - formattedNumber.length);
  return " ".repeat(remainingSpaces) + formattedNumber;
};

const getMeta = (properties: Properties) => {
  const fieldsMetaObject: {
    [key: string]: FieldMeta;
  } = {};
  let value: any;
  let decimal: any;
  let length: any;
  properties.forEach((props) => {
    Object.keys(props).forEach((key) => {
      value = props[key];

      if (typeof value === "boolean") {
        if (typeof fieldsMetaObject[key] === "undefined") {
          fieldsMetaObject[key] = {
            field_key: key,
            field_name: key,
            field_type: "L",
            field_length: 1,
            field_decimal_length: 0,
          };
        }
      } else if (typeof value === "string") {
        const encodedLength = new TextEncoder().encode(value).length;
        if (typeof fieldsMetaObject[key] === "undefined") {
          fieldsMetaObject[key] = {
            field_key: key,
            field_name: key,
            field_type: "C",
            field_length: Math.min(254, encodedLength),
            field_decimal_length: 0,
          };
        } else {
          fieldsMetaObject[key].field_length = Math.min(
            254,
            Math.max(value.length, fieldsMetaObject[key].field_length)
          );
        }
      } else if (typeof value === "number") {
        decimal = String(value).split(".")[1]?.length || 0;
        length = String(value).length;
        if (typeof fieldsMetaObject[key] === "undefined") {
          fieldsMetaObject[key] = {
            field_key: key,
            field_name: key,
            field_type: "N",
            field_length: length,
            field_decimal_length: decimal,
          };
        } else {
          fieldsMetaObject[key].field_length = Math.min(254, Math.max(length, fieldsMetaObject[key].field_length));
          fieldsMetaObject[key].field_decimal_length = Math.max(decimal, fieldsMetaObject[key].field_decimal_length);
        }
      }
    });
  });
  const recordLength = Object.values(fieldsMetaObject).reduce((total, meta) => {
    return total + meta.field_length;
  }, 1); // 1 - Data records are preceded by one byte, that is, a space (20h) if the record is not deleted, an asterisk (2Ah) if the record is deleted.

  //Remove possible duplicate keys
  const existingKeys = new Set<string>([]);
  const makeUniqueKey = (name: string): string => {
    let uniqueName = name;
    let counter = 1;
    while (existingKeys.has(uniqueName)) {
      uniqueName = truncateByByteLength(`${counter.toString().padStart(2, "0")}.${name}`, 10);
      counter++;
    }
    existingKeys.add(uniqueName);
    return uniqueName;
  };

  const fieldsMeta = Object.values(fieldsMetaObject).map((v) => {
    return {
      ...v,
      field_name: makeUniqueKey(truncateByByteLength(v.field_name, 10)),
    } as FieldMeta;
  });
  return { fieldsMeta, recordLength };
};
const dbf = (records: { [key: string]: string | number | boolean | object | any[] }[]) => {
  const { fieldsMeta, recordLength } = getMeta(records);

  const fileByteLength =
    32 + // Header
    32 * fieldsMeta.length + // Header fields descriptors
    1 + // 0x0D field Header terminator
    recordLength * records.length + // Records
    1; // 0x1A file-end marker

  const dbfView = createDataView(fileByteLength);
  dbfView.setUint8(fileByteLength - 1, 26); // 0x1A file-end marker

  dbfView.setUint8(0, 3);

  const now = new Date();
  dbfView.setUint8(1, now.getFullYear() - 1900); // Year
  dbfView.setUint8(2, now.getMonth() + 1); // Month
  dbfView.setUint8(3, now.getDate()); // Day

  dbfView.setInt32(4, records.length, true); // records count
  dbfView.setInt16(8, 32 + fieldsMeta.length * 32 + 1, true); // header length
  dbfView.setInt16(10, recordLength, true); // records length
  dbfView.setUint8(29, 0x30); // 0x30, Standard ASCII encoding

  fieldsMeta.forEach((meta, mi) => {
    for (let i = 0; i < 10; i++) {
      dbfView.setUint8(32 + mi * 32 + i, meta.field_name?.charCodeAt(i) || 0);
    }
    dbfView.setUint8(32 + mi * 32 + 11, meta.field_type?.charCodeAt(0));
    dbfView.setUint8(32 + mi * 32 + 16, meta.field_length);
    dbfView.setUint8(32 + mi * 32 + 17, meta.field_decimal_length);
  });

  dbfView.setUint8(32 + fieldsMeta.length * 32, 13); // Header terminator

  const recordStart = 32 + fieldsMeta.length * 32 + 1;

  records.forEach((record, recordIndex) => {
    let recordOffset = 1;
    dbfView.setUint8(recordStart + recordIndex * recordLength, 0x20); // 0x20 = " ".charCodeAt(0);
    fieldsMeta.forEach((field) => {
      const value = record[field.field_key];
      if (field.field_type === "C") {
        const string = formatStringField((value as string) || "", field.field_length);
        const utfEncoded = new TextEncoder().encode(string);
        for (let i = 0; i < field.field_length; i++) {
          dbfView.setUint8(recordStart + recordIndex * recordLength + recordOffset + i, utfEncoded[i] || 0x20);
        }
      } else if (field.field_type === "N") {
        const num = formatNumField((value as number) || -1, field.field_length, field.field_decimal_length);
        for (let i = 0; i < num.length; i++) {
          dbfView.setUint8(recordStart + recordIndex * recordLength + recordOffset + i, num.charCodeAt(i));
        }
      }
      recordOffset += field.field_length;
    });
  });

  return dbfView;
};

export default dbf;
