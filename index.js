const traverse = require('@unibtc/traverse');

function primitiveTypes(val) {
  let type = typeof val;
  if (val === null || type === 'undefined') return val;
  if (val instanceof Date) {
    return 'string'
  }
  if (val instanceof Buffer) {
    type = 'buffer'
  }
  if (!['number', 'string', 'boolean', 'buffer'].includes(type)) {
    return false
  }
  if (type === 'number') {
    type = numberType(val)
  }
  return type;
}
function inRange(x, min, max) {
  return x >= min && x <= max;
}

function isEmpty(val) {
  if(Array.isArray(val) && val.length) {
    return false;
  }
  if(Object.prototype.toString.call(val) === '[object Object]' && Object.keys(val).length) {
    return false;
  }
  if(val.length) {
    return false;
  }
  return true;
}

function numberType(val) {
  const maxfloat = 3.4028234663852886e+38;
  let signed = true
  if (val < 0) {
    signed = false
  }
  if (signed) {
    switch (true) {
      case inRange(val, 0, 0xff):
        return 'uint8';
      case inRange(val, 0, 0xffff):
        return 'uint16';
      case inRange(val, 0, 0x7fffffff):
        return 'varuint';
      case inRange(val, 0, 0xffffffff):
        return 'uint32';
      case inRange(val, 0, maxfloat):
        return 'float32'
      default:
        return 'float64'
    }
  } else {
    switch (true) {
      case inRange(val, -0x80, 0x7f):
        return 'int8';
      case inRange(val, -0x8000, 0x7fff):
        return 'int16';
      case inRange(val, -0x40000000, 0x3fffffff):
        return 'varint';
      case inRange(val, -0x80000000, 0x7fffffff):
        return 'int32';
      case inRange(val, -maxfloat, maxfloat):
        return 'float32'
      default:
        return 'float64'
    }
  }
}
const defaults = {
  falsy: true,
  array_combine: true
}
function generateSchema(schemaObj,options = {}) {
  if(isEmpty(schemaObj)) return schemaObj;
  options = Object.assign({},defaults,options)
  return traverse(schemaObj).map(function(val) {
    if (this.isLeaf) {
      const type = primitiveTypes(val);
      if (type === null || type === undefined) {
        this.remove()
      } else if (type) {
        this.update(type);
      }
    }
    this.after(function(a){
      if(options.falsy) {
        if(isEmpty(a)) {
          this.remove();
        }
      }
      if(Array.isArray(a) && a.length && options.array_combine){
        const subtype = a[0];
        const check = a.every(function(v){
          return v === subtype;
        })
        if(check) {
          a = [subtype]
          this.update(a)
        }
      }

    })

  })

}
module.exports = {
  generate:generateSchema
}