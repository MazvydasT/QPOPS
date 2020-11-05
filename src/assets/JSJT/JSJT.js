/**
 * @version 1.0.0.0
 * @author Microsoft
 * @copyright Copyright © Microsoft 2020
 * @compiler Bridge.NET 17.10.1
 */
Bridge.assembly("JSJT", function ($asm, globals) {
    "use strict";

    require(["pako"], function (pako) {
        Bridge.define("JSJT.Item", {
            fields: {
                title: null,
                children: null,
                transformationMatrix: null,
                filePath: null,
                attributes: null,
                parent: null
            }
        });
    
        Bridge.define("JSJT.Items2JT", {
            statics: {
                methods: {
                    Convert: function (items) {
    
                        var rootItems = System.Linq.Enumerable.from(items, JSJT.Item).where(function (i) {
                                return i.parent == null;
                            }).ToArray(JSJT.Item);
    
                        var rootItem = rootItems.length === 1 ? rootItems[System.Array.index(0, rootItems)] : { title: "Data", children: rootItems };
    
                        var rootNode = JSJT.Items2JT.Item2JTNode(rootItem);
    
                        return rootNode.ToBytes();
                    },
                    Item2JTNode: function (item) {
                        var $t, $t1, $t2;
                        var nodeAttributes = null;
    
                        if (item.attributes != null) {
                            nodeAttributes = new (System.Collections.Generic.Dictionary$2(System.String,System.Object)).ctor();
    
                            item.attributes.forEach(function (value, key, map) {
                                var $t;
                                nodeAttributes.setItem(($t = key, $t != null ? $t.valueOf() : $t), value.valueOf());
                            });
                        }
    
                        var node = ($t = new JTfy.JTNode.ctor(), $t.Name = ($t1 = item.title, $t1 != null ? $t1.valueOf() : $t1), $t.TransformationMatrix = item.transformationMatrix != null ? System.Linq.Enumerable.from(item.transformationMatrix, Number).select(function (v) {
                                return v;
                            }).ToArray(System.Single) : null, $t.Children = item.children != null ? System.Linq.Enumerable.from(item.children, JSJT.Item).select(function (c) {
                                return JSJT.Items2JT.Item2JTNode(c);
                            }).toList(JTfy.JTNode) : null, $t.ReferencedFile = ($t2 = item.filePath, $t2 != null ? $t2.valueOf() : $t2), $t.Attributes = nodeAttributes, $t);
    
                        return node;
                    }
                }
            }
        });
    
        Bridge.define("JTfy.AccumulatedProbabilityCounts", {
            fields: {
                SymbolCounts: null,
                EntriesByAccumulatedCountPerContext: null
            },
            ctors: {
                ctor: function (int32ProbabilityContexts) {
                    var $t, $t1, $t2;
                    this.$initialize();
                    this.SymbolCounts = System.Array.init(int32ProbabilityContexts.ProbabilityContextTableEntries.length, 0, System.Int32);
                    this.EntriesByAccumulatedCountPerContext = System.Array.init(this.SymbolCounts.length, null, System.Collections.Generic.Dictionary$2(System.Int32,System.Int32));
    
                    for (var tableIndex = 0, tableCount = this.SymbolCounts.length; tableIndex < tableCount; tableIndex = (tableIndex + 1) | 0) {
                        var table = ($t = int32ProbabilityContexts.ProbabilityContextTableEntries)[System.Array.index(tableIndex, $t)];
    
                        var accumulatedCount = 0;
    
                        var entryByAccumulatedCountPerContext = new (System.Collections.Generic.Dictionary$2(System.Int32,System.Int32)).ctor();
    
                        ($t1 = this.EntriesByAccumulatedCountPerContext)[System.Array.index(tableIndex, $t1)] = entryByAccumulatedCountPerContext;
    
                        for (var tableEntryIndex = 0, tableEntryCount = table.length; tableEntryIndex < tableEntryCount; tableEntryIndex = (tableEntryIndex + 1) | 0) {
                            accumulatedCount = (accumulatedCount + table[System.Array.index(tableEntryIndex, table)].OccurrenceCount) | 0;
                            entryByAccumulatedCountPerContext.setItem(((accumulatedCount - 1) | 0), tableEntryIndex);
                        }
    
                        ($t2 = this.SymbolCounts)[System.Array.index(tableIndex, $t2)] = accumulatedCount;
                    }
                }
            }
        });
    
        Bridge.define("JTfy.ArithmeticDecoder", {
            statics: {
                methods: {
                    Decode: function (codeTextWords, int32ProbabilityContexts, outOfBandValues, valueCount) {
                        var $t;
    
                        var bytes = System.Linq.Enumerable.from(codeTextWords, System.UInt32).selectMany(System.BitConverter.getBytes$8).ToArray(System.Byte);
    
                        var decodedSymbols = new (System.Collections.Generic.List$1(System.Int32)).$ctor2(valueCount);
    
                        var accumulatedProbabilityCounts = new JTfy.AccumulatedProbabilityCounts(int32ProbabilityContexts);
    
                        var code = 0;
                        var low = 0;
                        var high = 65535;
                        var bitBuffer = { v : 0 };
                        var bits = { v : 0 };
                        var symbolCount = valueCount;
                        var currentContext = 0;
                        var newSymbolRange = { v : System.Array.init(3, 0, System.Int32) };
                        var outOfBandDataCounter = 0;
    
                        var memoryStream = new System.IO.MemoryStream.$ctor1(bytes);
                        try {
                            var bitStream = new JTfy.BitStream(memoryStream);
    
                            JTfy.ArithmeticDecoder.GetNextCodeText(bitStream, bitBuffer, bits);
    
                            code = (bitBuffer.v >> 16) & 65535;
                            bitBuffer.v = bitBuffer.v << 16;
                            bits.v = 16;
    
                            for (var i = 0; i < symbolCount; i = (i + 1) | 0) {
                                var rescaledCode = (Bridge.Int.div((((Bridge.Int.mul(((((((code - low) | 0)) + 1) | 0)), ($t = accumulatedProbabilityCounts.SymbolCounts)[System.Array.index(currentContext, $t)]) - 1) | 0)), ((((((high - low) | 0)) + 1) | 0)))) | 0;
                                var int32ProbabilityContextTableEntry = JTfy.ArithmeticDecoder.GetEntryAndSymbolRangeByRescaledCode(accumulatedProbabilityCounts, int32ProbabilityContexts, currentContext, rescaledCode, newSymbolRange);
    
                                var range = (((high - low) | 0) + 1) | 0;
                                high = (low + (((((Bridge.Int.div((Bridge.Int.mul(range, newSymbolRange.v[System.Array.index(1, newSymbolRange.v)])), newSymbolRange.v[System.Array.index(2, newSymbolRange.v)])) | 0) - 1) | 0))) | 0;
                                low = (low + (((Bridge.Int.div((Bridge.Int.mul(range, newSymbolRange.v[System.Array.index(0, newSymbolRange.v)])), newSymbolRange.v[System.Array.index(2, newSymbolRange.v)])) | 0))) | 0;
    
                                while (true) {
                                    if (((~(high ^ low)) & 32768) > 0) {
                                    } else if (((low & 16384) > 0) && ((high & 16384) === 0)) {
                                        code = code ^ 16384;
                                        code = code & 65535;
    
                                        low = low & 16383;
                                        low = low & 65535;
    
                                        high = high | 16384;
                                        high = high & 65535;
                                    } else {
    
                                        break;
                                    }
    
                                    low = (low << 1) & 65535;
    
                                    high = (high << 1) & 65535;
                                    high = (high | 1) & 65535;
    
                                    code = (code << 1) & 65535;
    
                                    if (bits.v === 0) {
                                        JTfy.ArithmeticDecoder.GetNextCodeText(bitStream, bitBuffer, bits);
                                    }
    
                                    code = code | ((bitBuffer.v >> 31) & 1);
                                    bitBuffer.v = bitBuffer.v << 1;
                                    bits.v = (bits.v - 1) | 0;
                                }
    
                                var symbol = int32ProbabilityContextTableEntry.Symbol;
    
                                if (symbol !== -2 || currentContext <= 0) {
                                    if (symbol === -2 && outOfBandDataCounter >= outOfBandValues.length) {
                                        throw new System.Exception("'Out-Of-Band' data missing! Read values: " + i + " / " + symbolCount);
                                    }
    
                                    decodedSymbols.add(symbol === -2 && outOfBandDataCounter < outOfBandValues.length ? outOfBandValues[System.Array.index(Bridge.identity(outOfBandDataCounter, ((outOfBandDataCounter = (outOfBandDataCounter + 1) | 0))), outOfBandValues)] : int32ProbabilityContextTableEntry.AssociatedValue);
                                }
    
                                currentContext = int32ProbabilityContextTableEntry.NextContext;
                            }
                        }
                        finally {
                            if (Bridge.hasValue(memoryStream)) {
                                memoryStream.System$IDisposable$Dispose();
                            }
                        }
    
                        return decodedSymbols.ToArray();
                    },
                    GetNextCodeText: function (bitStream, bitBuffer, bits) {
                        var nBits = System.Int64.clip32(System.Int64.min(System.Int64(32), bitStream.Length.sub(bitStream.Position)));
                        var uCodeText = bitStream.ReadAsUnsignedInt(nBits);
    
                        if (nBits < 32) {
                            uCodeText = uCodeText << (((32 - nBits) | 0));
                        }
    
                        bitBuffer.v = uCodeText;
                        bits.v = nBits;
                    },
                    GetEntryAndSymbolRangeByRescaledCode: function (accumulatedProbabilityCounts, int32ProbabilityContexts, contextIndex, rescaledCode, newSymbolRange) {
                        var $t, $t1, $t2, $t3;
                        var entryByAccumulatedCountPerContext = ($t = accumulatedProbabilityCounts.EntriesByAccumulatedCountPerContext)[System.Array.index(contextIndex, $t)];
    
                        var key = System.Linq.Enumerable.from(entryByAccumulatedCountPerContext.Keys, System.Int32).orderBy(function (k) {
                                return k;
                            }).defaultIfEmpty(-1).first(function (k) {
                            return k > ((rescaledCode - 1) | 0);
                        });
                        var value = entryByAccumulatedCountPerContext.getItem(key);
    
                        var int32ProbabilityContextTableEntry = ($t1 = ($t2 = int32ProbabilityContexts.ProbabilityContextTableEntries)[System.Array.index(contextIndex, $t2)])[System.Array.index(value, $t1)];
    
                        newSymbolRange.v[System.Array.index(0, newSymbolRange.v)] = (((key + 1) | 0) - int32ProbabilityContextTableEntry.OccurrenceCount) | 0;
                        newSymbolRange.v[System.Array.index(1, newSymbolRange.v)] = (key + 1) | 0;
                        newSymbolRange.v[System.Array.index(2, newSymbolRange.v)] = ($t3 = accumulatedProbabilityCounts.SymbolCounts)[System.Array.index(contextIndex, $t3)];
    
                        return int32ProbabilityContextTableEntry;
                    }
                }
            }
        });
    
        Bridge.define("JTfy.BaseDataStructure");
    
        Bridge.define("JTfy.BitlengthCoder", {
            statics: {
                methods: {
                    Decode: function (codeTextWords, valueCount, codeTextLength) {
    
                        var bytes = System.Linq.Enumerable.from(codeTextWords, System.UInt32).selectMany(System.BitConverter.getBytes$8).ToArray(System.Byte);
    
                        var decodedSymbols = new (System.Collections.Generic.List$1(System.Int32)).$ctor2(valueCount);
    
                        var bitFieldWidth = 0;
    
                        var memoryStream = new System.IO.MemoryStream.$ctor1(bytes);
                        try {
                            var bitStream = new JTfy.BitStream(memoryStream);
    
                            while (bitStream.Position.ne(System.Int64(codeTextLength))) {
                                if (bitStream.ReadAsUnsignedInt(1) !== 0) {
                                    var adjustmentBit = bitStream.ReadAsUnsignedInt(1);
    
                                    do {
                                        if (adjustmentBit === 1) {
                                            bitFieldWidth = (bitFieldWidth + 2) | 0;
                                        } else {
                                            bitFieldWidth = (bitFieldWidth - 2) | 0;
                                        }
                                    } while (bitStream.ReadAsUnsignedInt(1) === adjustmentBit);
                                }
    
                                var decodedSymbol;
    
                                if (bitFieldWidth === 0) {
                                    decodedSymbol = 0;
                                } else {
                                    decodedSymbol = bitStream.ReadAsUnsignedInt(bitFieldWidth);
                                    decodedSymbol = decodedSymbol << (((32 - bitFieldWidth) | 0));
                                    decodedSymbol = decodedSymbol >> (((32 - bitFieldWidth) | 0));
                                }
    
                                decodedSymbols.add(decodedSymbol);
                            }
                        }
                        finally {
                            if (Bridge.hasValue(memoryStream)) {
                                memoryStream.System$IDisposable$Dispose();
                            }
                        }
    
                        return decodedSymbols.ToArray();
                    }
                }
            }
        });
    
        Bridge.define("JTfy.BitStream", {
            fields: {
                stream: null,
                Length: System.Int64(0),
                Position: System.Int64(0),
                buffer: null,
                bufferPosition: 0,
                initialised: false
            },
            ctors: {
                init: function () {
                    this.buffer = System.Array.init(8, false, System.Boolean);
                    this.initialised = false;
                },
                ctor: function (stream) {
                    this.$initialize();
                    this.stream = stream;
                    this.Length = stream.Length.shl(3);
                    this.Position = stream.Position.shl(3);
                }
            },
            methods: {
                ReadBit: function () {
                    if (!this.initialised) {
                        new System.Collections.BitArray.$ctor1(System.Array.init([JTfy.StreamUtils.ReadByte(this.stream)], System.Byte)).copyTo(this.buffer, 0);
                        System.Array.reverse(this.buffer);
    
                        this.bufferPosition = 0;
    
                        this.initialised = true;
                    }
    
                    if (this.Position.gte(this.Length)) {
                        throw new System.Exception("Cannot read past end of stream.");
                    }
    
                    if (this.bufferPosition === this.buffer.length) {
                        new System.Collections.BitArray.$ctor1(System.Array.init([JTfy.StreamUtils.ReadByte(this.stream)], System.Byte)).copyTo(this.buffer, 0);
                        System.Array.reverse(this.buffer);
    
                        this.bufferPosition = 0;
                    }
    
                    this.Position = this.Position.inc();
    
                    return this.buffer[System.Array.index(Bridge.identity(this.bufferPosition, ((this.bufferPosition = (this.bufferPosition + 1) & 255))), this.buffer)];
                },
                ReadBits: function (numberOfBitsToRead) {
                    var bitStack = new (System.Collections.Generic.Stack$1(System.Boolean)).$ctor2(numberOfBitsToRead);
    
                    for (var i = 0; i < numberOfBitsToRead; i = (i + 1) | 0) {
                        bitStack.Push(this.ReadBit());
                    }
    
                    return bitStack.ToArray();
                },
                ReadAsUnsignedInt: function (numberOfBitsToRead) {
                    var bytes = System.Array.init(4, 0, System.Byte);
    
                    new System.Collections.BitArray.ctor(this.ReadBits(numberOfBitsToRead)).copyTo(bytes, 0);
    
    
    
                    var result = System.Array.init([System.BitConverter.toInt32(bytes, 0)], System.Int32);
    
                    return result[System.Array.index(0, result)];
                },
                ReadAsSignedInt: function (numberOfBitsToRead) {
                    var result = this.ReadAsUnsignedInt(numberOfBitsToRead);
    
                    result = result << (((32 - numberOfBitsToRead) | 0));
                    result = result >> (((32 - numberOfBitsToRead) | 0));
    
                    return result;
                }
            }
        });
    
        Bridge.define("JTfy.CalcUtils", {
            statics: {
                methods: {
                    GetTriangleArea$1: function (point1, point2, point3) {
                        return JTfy.CalcUtils.GetTriangleArea(new JTfy.Point3D(point1[System.Array.index(0, point1)], point1[System.Array.index(1, point1)], point1[System.Array.index(2, point1)]), new JTfy.Point3D(point2[System.Array.index(0, point2)], point2[System.Array.index(1, point2)], point2[System.Array.index(2, point2)]), new JTfy.Point3D(point3[System.Array.index(0, point3)], point3[System.Array.index(1, point3)], point3[System.Array.index(2, point3)]));
                    },
                    GetTriangleArea: function (point1, point2, point3) {
                        var a = JTfy.CalcUtils.GetPointToPointDistance(point2, point1);
                        var b = JTfy.CalcUtils.GetPointToPointDistance(point3, point2);
                        var c = JTfy.CalcUtils.GetPointToPointDistance(point1, point3);
                        var s = (a + b + c) / 2;
                        return Math.sqrt(s * (s - a) * (s - b) * (s - c));
                    },
                    GetPointToPointDistance: function (point1, point2) {
                        return Math.sqrt(Math.pow(point2.X - point1.X, 2) + Math.pow(point2.Y - point1.Y, 2) + Math.pow(point2.Z - point1.Z, 2));
                    }
                }
            }
        });
    
        Bridge.define("JTfy.Color", {
            statics: {
                methods: {
                    FromArgb: function (red, green, blue) {
                        return JTfy.Color.FromArgb$1(255, red, green, blue);
                    },
                    FromArgb$1: function (alpha, red, green, blue) {
                        var $t;
                        if (alpha < 0 || alpha > 255) {
                            throw new System.ArgumentException.$ctor1("alpha is not within [0, 255] range");
                        }
                        if (red < 0 || red > 255) {
                            throw new System.ArgumentException.$ctor1("red is not within [0, 255] range");
                        }
                        if (green < 0 || green > 255) {
                            throw new System.ArgumentException.$ctor1("green is not within [0, 255] range");
                        }
                        if (blue < 0 || blue > 255) {
                            throw new System.ArgumentException.$ctor1("blue is not within [0, 255] range");
                        }
    
                        return ($t = new JTfy.Color(), $t.A = (alpha & 255), $t.R = (red & 255), $t.G = (green & 255), $t.B = (blue & 255), $t);
                    }
                }
            },
            fields: {
                A: 0,
                R: 0,
                G: 0,
                B: 0
            }
        });
    
        Bridge.define("JTfy.ColourUtils", {
            statics: {
                methods: {
                    HSV2RGB: function (h, S, V) {
                        var H = h;
                        while (H < 0) {
                            H += 360;
                        }
                        ;
                        while (H >= 360) {
                            H -= 360;
                        }
                        ;
                        var R, G, B;
                        if (V <= 0) {
                            R = (G = (B = 0));
                        } else if (S <= 0) {
                            R = (G = (B = V));
                        } else {
                            var hf = H / 60.0;
                            var i = Bridge.Int.clip32(Math.floor(hf));
                            var f = hf - i;
                            var pv = V * (1 - S);
                            var qv = V * (1 - S * f);
                            var tv = V * (1 - S * (1 - f));
                            switch (i) {
                                case 0: 
                                    R = V;
                                    G = tv;
                                    B = pv;
                                    break;
                                case 1: 
                                    R = qv;
                                    G = V;
                                    B = pv;
                                    break;
                                case 2: 
                                    R = pv;
                                    G = V;
                                    B = tv;
                                    break;
                                case 3: 
                                    R = pv;
                                    G = qv;
                                    B = V;
                                    break;
                                case 4: 
                                    R = tv;
                                    G = pv;
                                    B = V;
                                    break;
                                case 5: 
                                    R = V;
                                    G = pv;
                                    B = qv;
                                    break;
                                case 6: 
                                    R = V;
                                    G = tv;
                                    B = pv;
                                    break;
                                case -1: 
                                    R = V;
                                    G = pv;
                                    B = qv;
                                    break;
                                default: 
                                    R = (G = (B = V));
                                    break;
                            }
                        }
    
                        return JTfy.Color.FromArgb(JTfy.ColourUtils.Clamp(Bridge.Int.clip32(R * 255.0)), JTfy.ColourUtils.Clamp(Bridge.Int.clip32(G * 255.0)), JTfy.ColourUtils.Clamp(Bridge.Int.clip32(B * 255.0)));
                    },
                    /**
                     * Clamp a value to 0-255
                     *
                     * @static
                     * @private
                     * @this JTfy.ColourUtils
                     * @memberof JTfy.ColourUtils
                     * @param   {number}    i
                     * @return  {number}
                     */
                    Clamp: function (i) {
                        if (i < 0) {
                            return 0;
                        }
                        if (i > 255) {
                            return 255;
                        }
                        return i;
                    }
                }
            }
        });
    
        Bridge.define("JTfy.CompressionUtils", {
            statics: {
                methods: {
                    Compress: function (data) {
                        var $t;
                        return ($t = System.Byte, System.Linq.Enumerable.from(pako.deflate(new Uint8Array(data), { level: 8 }), $t).ToArray($t));
    
                        /* using (var compressedDataStream = new MemoryStream())
                        using (var zOutputStream = new zlib.ZOutputStream(compressedDataStream, zlib.zlibConst.Z_BEST_COMPRESSION))
                        //using (var zOutputStream = new zlib.ZOutputStream(compressedDataStream, 9))
                        {
                           zOutputStream.Write(data, 0, data.Length);
                           zOutputStream.Flush();
                           zOutputStream.finish();
    
                           return compressedDataStream.ToArray();
                        }*/
                    },
                    Decompress: function (data) {
                        var $t;
                        return ($t = System.Byte, System.Linq.Enumerable.from(pako.inflate(new Uint8Array(data)), $t).ToArray($t));
    
                        /* using (var decompressedDataStream = new MemoryStream())
                        using (var zOutputStream = new zlib.ZOutputStream(decompressedDataStream))
                        {
                           zOutputStream.Write(data, 0, data.Length);
                           zOutputStream.Flush();
                           zOutputStream.finish();
    
                           return decompressedDataStream.ToArray();
                        }*/
                    }
                }
            }
        });
    
        Bridge.define("JTfy.ConstUtils", {
            statics: {
                fields: {
                    VariantStringEnding: null,
                    VariantStringRequiredLength: 0,
                    EndOfElementAsString: null,
                    EndOfElement: null,
                    ObjectTypeIdToType: null,
                    TypeToObjectTypeId: null
                },
                props: {
                    IndentityMatrix: {
                        get: function () {
                            return System.Array.init([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], System.Single);
                        }
                    }
                },
                ctors: {
                    init: function () {
                        this.VariantStringEnding = " \n\r\n ";
                        this.VariantStringRequiredLength = 80;
                        this.EndOfElementAsString = "{0xffffffff,0xffff,0xffff,{0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff}}";
                        this.EndOfElement = new JTfy.GUID.$ctor2(JTfy.ConstUtils.EndOfElementAsString);
                        this.ObjectTypeIdToType = function (_o1) {
                                _o1.add("{0x10dd102a,0x2ac8,0x11d1,{0x9b,0x6b,0x00,0x80,0xc7,0xbb,0x59,0x97}}", { Item1: JTfy.InstanceNodeElement, Item2: 0 });
                                _o1.add("{0x10dd103e,0x2ac8,0x11d1,{0x9b,0x6b,0x00,0x80,0xc7,0xbb,0x59,0x97}}", { Item1: JTfy.PartitionNodeElement, Item2: 1 });
                                _o1.add("{0xce357245,0x38fb,0x11d1,{0xa5,0x06,0x00,0x60,0x97,0xbd,0xc6,0xe1}}", { Item1: JTfy.MetaDataNodeElement, Item2: 1 });
                                _o1.add("{0xce357244,0x38fb,0x11d1,{0xa5,0x06,0x00,0x60,0x97,0xbd,0xc6,0xe1}}", { Item1: JTfy.PartNodeElement, Item2: 1 });
                                _o1.add("{0x10dd104c,0x2ac8,0x11d1,{0x9b,0x6b,0x00,0x80,0xc7,0xbb,0x59,0x97}}", { Item1: JTfy.RangeLODNodeElement, Item2: 1 });
                                _o1.add("{0x10dd101b,0x2ac8,0x11d1,{0x9b,0x6b,0x00,0x80,0xc7,0xbb,0x59,0x97}}", { Item1: JTfy.GroupNodeElement, Item2: 1 });
                                _o1.add("{0x10dd1077,0x2ac8,0x11d1,{0x9b,0x6b,0x00,0x80,0xc7,0xbb,0x59,0x97}}", { Item1: JTfy.TriStripSetShapeNodeElement, Item2: 2 });
                                _o1.add("{0x10dd1030,0x2ac8,0x11d1,{0x9b,0x6b,0x00,0x80,0xc7,0xbb,0x59,0x97}}", { Item1: JTfy.MaterialAttributeElement, Item2: 3 });
                                _o1.add("{0x10dd1083,0x2ac8,0x11d1,{0x9b,0x6b,0x00,0x80,0xc7,0xbb,0x59,0x97}}", { Item1: JTfy.GeometricTransformAttributeElement, Item2: 3 });
                                _o1.add("{0x10dd106e,0x2ac8,0x11d1,{0x9b,0x6b,0x00,0x80,0xc7,0xbb,0x59,0x97}}", { Item1: JTfy.StringPropertyAtomElement, Item2: 5 });
                                _o1.add("{0x10dd1019,0x2ac8,0x11d1,{0x9b,0x6b,0x00,0x80,0xc7,0xbb,0x59,0x97}}", { Item1: JTfy.FloatingPointPropertyAtomElement, Item2: 5 });
                                _o1.add("{0x10dd102b,0x2ac8,0x11d1,{0x9b,0x6b,0x00,0x80,0xc7,0xbb,0x59,0x97}}", { Item1: JTfy.IntegerPropertyAtomElement, Item2: 5 });
                                _o1.add("{0xce357246,0x38fb,0x11d1,{0xa5,0x06,0x00,0x60,0x97,0xbd,0xc6,0xe1}}", { Item1: JTfy.DatePropertyAtomElement, Item2: 5 });
                                _o1.add("{0xe0b05be5,0xfbbd,0x11d1,{0xa3,0xa7,0x00,0xaa,0x00,0xd1,0x09,0x54}}", { Item1: JTfy.LateLoadedPropertyAtomElement, Item2: 8 });
                                _o1.add("{0xce357247,0x38fb,0x11d1,{0xa5,0x06,0x00,0x60,0x97,0xbd,0xc6,0xe1}}", { Item1: JTfy.PropertyProxyMetaDataElement, Item2: 9 });
                                _o1.add("{0x10dd10ab,0x2ac8,0x11d1,{0x9b,0x6b,0x00,0x80,0xc7,0xbb,0x59,0x97}}", { Item1: JTfy.TriStripSetShapeLODElement, Item2: 4 });
                                return _o1;
                            }(new (System.Collections.Generic.Dictionary$2(System.String,System.Tuple$2(System.Type,System.Byte))).ctor());
                    },
                    ctor: function () {
                        var $t;
                        JTfy.ConstUtils.TypeToObjectTypeId = new (System.Collections.Generic.Dictionary$2(System.Type,System.Tuple$2(System.String,System.Byte))).$ctor4(JTfy.ConstUtils.ObjectTypeIdToType.Count);
    
                        $t = Bridge.getEnumerator(JTfy.ConstUtils.ObjectTypeIdToType);
                        try {
                            while ($t.moveNext()) {
                                var entry = $t.Current;
                                JTfy.ConstUtils.TypeToObjectTypeId.setItem(entry.value.Item1, { Item1: entry.key, Item2: entry.value.Item2 });
                            }
                        } finally {
                            if (Bridge.is($t, System.IDisposable)) {
                                $t.System$IDisposable$Dispose();
                            }
                        }
                    }
                }
            }
        });
    
        Bridge.define("JTfy.GeometricSet", {
            fields: {
                positions: null,
                Normals: null,
                triStrips: null,
                colour: null,
                id: 0
            },
            props: {
                Positions: {
                    get: function () {
                        return this.positions;
                    },
                    set: function (value) {
                        this.positions = value || (System.Array.init(0, null, System.Array.type(System.Single)));
                    }
                },
                TriStrips: {
                    get: function () {
                        return this.triStrips;
                    },
                    set: function (value) {
                        this.triStrips = value || (System.Array.init(0, null, System.Array.type(System.Int32)));
                    }
                },
                Colour: {
                    get: function () {
                        return this.colour;
                    },
                    set: function (value) {
                        this.colour = value;
                    }
                },
                ID: {
                    get: function () {
                        return this.id;
                    },
                    set: function (value) {
                        this.id = value;
                    }
                },
                TriangleCount: {
                    get: function () {
                        var $t;
                        var vertexCount = 0;
    
                        for (var i = 0, c = this.TriStrips.length; i < c; i = (i + 1) | 0) {
                            vertexCount = (vertexCount + (((($t = this.TriStrips)[System.Array.index(i, $t)].length - 2) | 0))) | 0;
                        }
    
                        return vertexCount;
                    }
                },
                Area: {
                    get: function () {
                        var $t, $t1, $t2, $t3;
                        var area = 0;
    
                        for (var triStripIndex = 0, triStripCount = this.TriStrips.length; triStripIndex < triStripCount; triStripIndex = (triStripIndex + 1) | 0) {
                            var triStrip = ($t = this.TriStrips)[System.Array.index(triStripIndex, $t)];
    
                            for (var i = 0, c = (triStrip.length - 2) | 0; i < c; i = (i + 1) | 0) {
                                area += JTfy.CalcUtils.GetTriangleArea$1(($t1 = this.Positions)[System.Array.index(triStrip[System.Array.index(i, triStrip)], $t1)], ($t2 = this.Positions)[System.Array.index(triStrip[System.Array.index(((i + 1) | 0), triStrip)], $t2)], ($t3 = this.Positions)[System.Array.index(triStrip[System.Array.index(((i + 2) | 0), triStrip)], $t3)]);
                            }
                        }
    
                        return area;
                    }
                },
                Size: {
                    get: function () {
                        var $t;
                        var size = Bridge.Int.mul(Bridge.Int.mul(this.Positions.length, 4), (this.Normals == null ? 1 : 2));
    
                        for (var i = 0, c = this.TriStrips.length; i < c; i = (i + 1) | 0) {
                            size = (size + (Bridge.Int.mul(($t = this.TriStrips)[System.Array.index(i, $t)].length, 4))) | 0;
                        }
    
                        return size;
                    }
                },
                Center: {
                    get: function () {
                        var boundingBox = this.UntransformedBoundingBox;
                        var maxCorner = boundingBox.MaxCorner;
                        var minCorner = boundingBox.MinCorner;
    
                        return new JTfy.CoordF32.$ctor2(maxCorner.X - minCorner.X, maxCorner.Y - minCorner.Y, maxCorner.Z - minCorner.Z);
                    }
                },
                UntransformedBoundingBox: {
                    get: function () {
                        var $t;
                        var minX = 0, minY = 0, minZ = 0, maxX = 0, maxY = 0, maxZ = 0;
    
                        for (var i = 0, c = this.Positions.length; i < c; i = (i + 1) | 0) {
                            var position = ($t = this.Positions)[System.Array.index(i, $t)];
                            var x = position[System.Array.index(0, position)];
                            var y = position[System.Array.index(1, position)];
                            var z = position[System.Array.index(2, position)];
    
                            if (i === 0) {
                                minX = (maxX = x);
                                minY = (maxY = y);
                                minZ = (maxZ = z);
                            } else {
                                if (x < minX) {
                                    minX = x;
                                }
                                if (y < minY) {
                                    minY = y;
                                }
                                if (z < minZ) {
                                    minZ = z;
                                }
    
                                if (x > maxX) {
                                    maxX = x;
                                }
                                if (y > maxY) {
                                    maxY = y;
                                }
                                if (z > maxZ) {
                                    maxZ = z;
                                }
                            }
                        }
    
                        return new JTfy.BBoxF32.$ctor3(minX, minY, minZ, maxX, maxY, maxZ);
                    }
                }
            },
            ctors: {
                init: function () {
                    this.positions = System.Array.init(0, null, System.Array.type(System.Single));
                    this.triStrips = System.Array.init(0, null, System.Array.type(System.Int32));
                    this.colour = JTfy.RandomGenUtils.NextColour();
                    this.id = JTfy.IdGenUtils.NextId;
                },
                ctor: function (triStrips, positions) {
                    this.$initialize();
                    this.TriStrips = triStrips;
                    this.Positions = positions;
                }
            },
            methods: {
                toString: function () {
                    /* var stringList = new List<string>(Positions.Length * (Normals == null ? 1 : 2) + TriStrips.Length);
    
                    for (int i = 0, c = Positions.Length; i < c; ++i)
                    {
                       stringList.Add(String.Join(",", Positions[i]));
    
                       if (Normals != null)
                       {
                           stringList.Add(String.Join(",", Normals[i]));
                       }
                    }
    
                    for (int i = 0, c = TriStrips.Length; i < c; ++i)
                    {
                       stringList.Add(String.Join(",", TriStrips[i]));
                    }
    
                    return String.Join("|", stringList) + Colour.ToString();*/
    
                    return Bridge.toString(this.ID);
                }
            }
        });
    
        Bridge.define("JTfy.IdGenUtils", {
            statics: {
                fields: {
                    id: 0
                },
                props: {
                    NextId: {
                        get: function () {
                            var $t;
                            return (($t = (JTfy.IdGenUtils.id + 1) | 0, JTfy.IdGenUtils.id = $t, $t));
                        }
                    }
                },
                ctors: {
                    init: function () {
                        this.id = 0;
                    }
                }
            }
        });
    
        Bridge.define("JTfy.Int32CompressedDataPacket", {
            statics: {
                methods: {
                    Encode: function (data, predictorType) {
                        if (predictorType === void 0) { predictorType = 8; }
                        var packedValue = JTfy.Int32CompressedDataPacket.PackUnpack(data, predictorType, false);
                        var encodedValues = JTfy.Int32CompressedDataPacket.EncodeValues(packedValue);
    
                        return encodedValues;
                    },
                    GetArrayI32: function (stream, predictorType) {
                        if (predictorType === void 0) { predictorType = 8; }
                        var decodedSymbols = JTfy.Int32CompressedDataPacket.DecodeBytes(stream);
                        var unpackedValues = JTfy.Int32CompressedDataPacket.PackUnpack(decodedSymbols, predictorType);
    
                        return unpackedValues;
                    },
                    DecodeBytes: function (stream) {
                        var codecType = JTfy.StreamUtils.ReadByte(stream);
    
                        var int32ProbabilityContexts = null;
    
                        if (codecType === JTfy.Int32CompressedDataPacket.CODECType.Huffman || codecType === JTfy.Int32CompressedDataPacket.CODECType.Arithmetic) {
                            throw new System.NotImplementedException.$ctor1("Huffman && Arithmetic codec NOT IMPLEMENTED");
    
                            /* int32ProbabilityContexts = new Int32ProbabilityContexts(stream);
                            outOfBandValueCount = StreamUtils.ReadInt32(stream);
    
                            if (outOfBandValueCount > 0)
                            {
                               outOfBandValues = DecodeBytes(stream);
                            }*/
                        }
    
                        if (codecType !== JTfy.Int32CompressedDataPacket.CODECType.Null) {
                            var codeTextLength = JTfy.StreamUtils.ReadInt32(stream);
                            var valueElementCount = JTfy.StreamUtils.ReadInt32(stream);
    
                            if (int32ProbabilityContexts != null && int32ProbabilityContexts.ProbabilityContextTableEntries.length > 1) {
                                JTfy.StreamUtils.ReadInt32(stream);
                            }
    
                            var wordsToRead = JTfy.StreamUtils.ReadInt32(stream);
                            var codeText = System.Array.init(wordsToRead, 0, System.UInt32);
                            for (var i = 0; i < wordsToRead; i = (i + 1) | 0) {
                                var codeTextWord;
    
                                if (JTfy.StreamUtils.DataIsLittleEndian) {
                                    var bytes = JTfy.StreamUtils.ReadBytes(stream, 4, true);
                                    System.Array.reverse(bytes);
    
    
                                    var result = System.Array.init([System.BitConverter.toUInt32(bytes, 0)], System.UInt32);
    
                                    codeTextWord = result[System.Array.index(0, result)];
                                } else {
                                    codeTextWord = JTfy.StreamUtils.ReadUInt32(stream);
                                }
    
                                codeText[System.Array.index(i, codeText)] = codeTextWord;
                            }
    
                            switch (codecType) {
                                case JTfy.Int32CompressedDataPacket.CODECType.Bitlength: 
                                    return JTfy.BitlengthCoder.Decode(codeText, valueElementCount, codeTextLength);
                                case JTfy.Int32CompressedDataPacket.CODECType.Huffman: 
                                    throw new System.NotImplementedException.$ctor1("Huffman codec NOT IMPLEMENTED");
                                case JTfy.Int32CompressedDataPacket.CODECType.Arithmetic: 
                                    throw new System.NotImplementedException.$ctor1("Huffman codec NOT IMPLEMENTED");
                            }
                        } else {
                            var integersToRead = JTfy.StreamUtils.ReadInt32(stream);
    
                            var decodedSymbols = System.Array.init(integersToRead, 0, System.Int32);
    
                            for (var i1 = 0; i1 < integersToRead; i1 = (i1 + 1) | 0) {
                                decodedSymbols[System.Array.index(i1, decodedSymbols)] = JTfy.StreamUtils.ReadInt32(stream);
                            }
    
                            return decodedSymbols;
                        }
    
                        return System.Array.init(0, 0, System.Int32);
                    },
                    EncodeValues: function (values) {
                        var valuesLength = values.length;
                        var byteCount = (5 + Bridge.Int.mul(valuesLength, 4)) | 0;
    
                        var bytesList = function (_o1) {
                                _o1.add(JTfy.Int32CompressedDataPacket.CODECType.Null);
                                return _o1;
                            }(new (System.Collections.Generic.List$1(System.Byte)).$ctor2(byteCount));
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(valuesLength));
    
                        for (var i = 0; i < valuesLength; i = (i + 1) | 0) {
                            bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(values[System.Array.index(i, values)]));
                        }
    
                        return bytesList.ToArray();
                    },
                    PackUnpack: function (residuals, predictorType, unpack) {
                        if (unpack === void 0) { unpack = true; }
                        if (predictorType === JTfy.Int32CompressedDataPacket.PredictorType.NULL) {
                            return residuals;
                        }
    
                        var unpackedResiduals = System.Array.init(residuals.length, 0, System.Int32);
    
                        for (var i = 0, c = residuals.length; i < c; i = (i + 1) | 0) {
                            if (i < 4) {
                                unpackedResiduals[System.Array.index(i, unpackedResiduals)] = residuals[System.Array.index(i, residuals)];
                            } else {
                                var iPredicted = JTfy.Int32CompressedDataPacket.PredictValue(unpack ? unpackedResiduals : residuals, i, predictorType);
    
                                unpackedResiduals[System.Array.index(i, unpackedResiduals)] = (predictorType === JTfy.Int32CompressedDataPacket.PredictorType.Xor1 || predictorType === JTfy.Int32CompressedDataPacket.PredictorType.Xor2 ? residuals[System.Array.index(i, residuals)] ^ iPredicted : ((residuals[System.Array.index(i, residuals)] + (Bridge.Int.mul((unpack ? 1 : -1), iPredicted))) | 0));
                            }
                        }
    
                        return unpackedResiduals;
                    },
                    PredictValue: function (unpackedValues, index, predictorType) {
                        var v1 = unpackedValues[System.Array.index(((index - 1) | 0), unpackedValues)];
                        var v2 = unpackedValues[System.Array.index(((index - 2) | 0), unpackedValues)];
                        var v4 = unpackedValues[System.Array.index(((index - 4) | 0), unpackedValues)];
    
                        switch (predictorType) {
                            default: 
                            case JTfy.Int32CompressedDataPacket.PredictorType.Lag1: 
                            case JTfy.Int32CompressedDataPacket.PredictorType.Xor1: 
                                return v1;
                            case JTfy.Int32CompressedDataPacket.PredictorType.Lag2: 
                            case JTfy.Int32CompressedDataPacket.PredictorType.Xor2: 
                                return v2;
                            case JTfy.Int32CompressedDataPacket.PredictorType.Stride1: 
                                return ((v1 + (((v1 - v2) | 0))) | 0);
                            case JTfy.Int32CompressedDataPacket.PredictorType.Stride2: 
                                return ((v2 + (((v2 - v4) | 0))) | 0);
                            case JTfy.Int32CompressedDataPacket.PredictorType.StripIndex: 
                                return ((v2 - v4) | 0) < 8 && ((v2 - v4) | 0) > -8 ? ((v2 + (((v2 - v4) | 0))) | 0) : ((v2 + 2) | 0);
                            case JTfy.Int32CompressedDataPacket.PredictorType.Ramp: 
                                return index;
                        }
                    }
                }
            }
        });
    
        Bridge.define("JTfy.Int32CompressedDataPacket.CODECType", {
            $kind: "nested enum",
            statics: {
                fields: {
                    Null: 0,
                    Bitlength: 1,
                    Huffman: 2,
                    Arithmetic: 3
                }
            }
        });
    
        Bridge.define("JTfy.Int32CompressedDataPacket.PredictorType", {
            $kind: "nested enum",
            statics: {
                fields: {
                    Lag1: 0,
                    Lag2: 1,
                    Stride1: 2,
                    Stride2: 3,
                    StripIndex: 4,
                    Ramp: 5,
                    Xor1: 6,
                    Xor2: 7,
                    NULL: 8
                }
            }
        });
    
        Bridge.define("JTfy.JTNode", {
            statics: {
                fields: {
                    measurementUnitStrings: null
                },
                ctors: {
                    init: function () {
                        this.measurementUnitStrings = new (System.Collections.Generic.Dictionary$2(JTfy.JTNode.MeasurementUnits,System.String)).ctor();
                    }
                }
            },
            fields: {
                ID: 0,
                attributes: null,
                children: null,
                MeasurementUnit: 0,
                Number: null,
                Name: null,
                geometricSets: null,
                TransformationMatrix: null,
                ReferencedFile: null,
                uniquePropertyIds: null,
                uniqueAttributeIds: null,
                uniqueMetaDataSegmentHeaders: null,
                propertyTableContents: null,
                elements: null,
                propertyAtomElements: null,
                savedFileIds: null,
                shapeLODSegments: null,
                shapeLODSegmentHeaders: null,
                compressedMetaDataSegments: null,
                metaDataSegmentHeadersZLIB: null,
                metaDataSegmentHeaders: null,
                monolithic: false,
                separateAttributeSegments: false
            },
            props: {
                Attributes: {
                    get: function () {
                        return this.attributes;
                    },
                    set: function (value) {
                        this.attributes = value || new (System.Collections.Generic.Dictionary$2(System.String,System.Object)).ctor();
                    }
                },
                Children: {
                    get: function () {
                        return this.children;
                    },
                    set: function (value) {
                        this.children = value || new (System.Collections.Generic.List$1(JTfy.JTNode)).ctor();
                    }
                },
                MeasurementUnitAsString: {
                    get: function () {
                        if (JTfy.JTNode.measurementUnitStrings.containsKey(this.MeasurementUnit)) {
                            return JTfy.JTNode.measurementUnitStrings.getItem(this.MeasurementUnit);
                        }
    
                        var measurementUnitString = System.Enum.toString(JTfy.JTNode.MeasurementUnits, this.MeasurementUnit);
    
                        JTfy.JTNode.measurementUnitStrings.setItem(this.MeasurementUnit, measurementUnitString);
    
                        return measurementUnitString;
                    }
                },
                GeometricSets: {
                    get: function () {
                        return this.geometricSets;
                    },
                    set: function (value) {
                        this.geometricSets = value || (System.Array.init(0, null, JTfy.GeometricSet));
                    }
                }
            },
            ctors: {
                init: function () {
                    this.ID = JTfy.IdGenUtils.NextId;
                    this.attributes = new (System.Collections.Generic.Dictionary$2(System.String,System.Object)).ctor();
                    this.children = new (System.Collections.Generic.List$1(JTfy.JTNode)).ctor();
                    this.MeasurementUnit = JTfy.JTNode.MeasurementUnits.Millimeters;
                    this.geometricSets = System.Array.init(0, null, JTfy.GeometricSet);
                    this.uniquePropertyIds = new (System.Collections.Generic.Dictionary$2(System.String,System.Int32)).ctor();
                    this.uniqueAttributeIds = new (System.Collections.Generic.Dictionary$2(System.String,System.Int32)).ctor();
                    this.uniqueMetaDataSegmentHeaders = new (System.Collections.Generic.Dictionary$2(JTfy.JTNode,JTfy.SegmentHeader)).ctor();
                    this.propertyTableContents = new (System.Collections.Generic.Dictionary$2(System.Int32,JTfy.NodePropertyTable)).ctor();
                    this.elements = new (System.Collections.Generic.List$1(JTfy.BaseDataStructure)).ctor();
                    this.propertyAtomElements = new (System.Collections.Generic.List$1(JTfy.BasePropertyAtomElement)).ctor();
                    this.savedFileIds = new (System.Collections.Generic.Dictionary$2(System.Int32,JTfy.PartitionNodeElement)).ctor();
                    this.shapeLODSegments = new (System.Collections.Generic.List$1(JTfy.ShapeLODSegment)).ctor();
                    this.shapeLODSegmentHeaders = new (System.Collections.Generic.List$1(JTfy.SegmentHeader)).ctor();
                    this.compressedMetaDataSegments = new (System.Collections.Generic.List$1(System.Array.type(System.Byte))).ctor();
                    this.metaDataSegmentHeadersZLIB = new (System.Collections.Generic.List$1(JTfy.LogicElementHeaderZLIB)).ctor();
                    this.metaDataSegmentHeaders = new (System.Collections.Generic.List$1(JTfy.SegmentHeader)).ctor();
                },
                ctor: function () {
                    this.$initialize();
                },
                $ctor1: function (node) {
                    this.$initialize();
                    this.ID = node.ID;
                    this.Attributes = node.Attributes;
                    this.Children = node.Children;
                    this.GeometricSets = node.GeometricSets;
                    this.MeasurementUnit = node.MeasurementUnit;
                    this.Number = node.Number;
                    this.Name = node.Name;
                    this.TransformationMatrix = node.TransformationMatrix;
                    this.ReferencedFile = node.ReferencedFile;
                }
            },
            methods: {
                Clone: function () {
                    return new JTfy.JTNode.$ctor1(this);
                },
                ToBytes: function () {
                    this.uniquePropertyIds.clear();
                    this.uniqueAttributeIds.clear();
                    this.uniqueMetaDataSegmentHeaders.clear();
    
                    this.propertyTableContents.clear();
    
                    this.elements.clear();
                    this.propertyAtomElements.clear();
    
                    this.savedFileIds.clear();
    
                    this.shapeLODSegments.clear();
                    this.shapeLODSegmentHeaders.clear();
    
                    this.compressedMetaDataSegments.clear();
                    this.metaDataSegmentHeadersZLIB.clear();
                    this.metaDataSegmentHeaders.clear();
    
                    this.monolithic = true;
                    this.separateAttributeSegments = false;
    
    
    
                    var fileHeader = new JTfy.FileHeader.$ctor1("Version 8.1 JT", ((System.BitConverter.isLittleEndian ? 0 : 1) & 255), JTfy.FileHeader.Size, JTfy.GUID.NewGUID());
    
    
    
    
    
    
                    this.CreateElement(this);
    
    
    
    
    
                    var keys = System.Array.init(this.propertyTableContents.Keys.Count, 0, System.Int32);
                    this.propertyTableContents.Keys.copyTo(keys, 0);
    
                    var values = System.Array.init(this.propertyTableContents.Values.Count, null, JTfy.NodePropertyTable);
                    this.propertyTableContents.Values.copyTo(values, 0);
    
                    var lsgSegment = new JTfy.LSGSegment.ctor(new (System.Collections.Generic.List$1(JTfy.BaseDataStructure)).$ctor1(this.elements), this.propertyAtomElements, new JTfy.PropertyTable.ctor(keys, values));
    
    
    
    
    
                    var compressedLSGSegmentData = JTfy.CompressionUtils.Compress(lsgSegment.Bytes);
    
    
    
    
    
                    var lsgSegmentLogicElementHeaderZLIB = new JTfy.LogicElementHeaderZLIB.ctor(2, ((compressedLSGSegmentData.length + 1) | 0), 2);
    
    
    
    
    
                    var lsgSegmentHeader = new JTfy.SegmentHeader.ctor(fileHeader.LSGSegmentID, 1, ((((JTfy.SegmentHeader.Size + lsgSegmentLogicElementHeaderZLIB.ByteCount) | 0) + compressedLSGSegmentData.length) | 0));
    
    
    
    
    
                    var lsgTOCEntry = new JTfy.TOCEntry.ctor(lsgSegmentHeader.SegmentID, -1, lsgSegmentHeader.SegmentLength, ((lsgSegmentHeader.SegmentType << 24) >>> 0));
    
                    var tocEntries = function (_o1) {
                            _o1.add(lsgTOCEntry);
                            return _o1;
                        }(new (System.Collections.Generic.List$1(JTfy.TOCEntry)).ctor());
    
                    for (var i = 0, c = this.shapeLODSegmentHeaders.Count; i < c; i = (i + 1) | 0) {
                        var shapeLODSegmentHeader = this.shapeLODSegmentHeaders.getItem(i);
    
                        tocEntries.add(new JTfy.TOCEntry.ctor(shapeLODSegmentHeader.SegmentID, -1, shapeLODSegmentHeader.SegmentLength, ((shapeLODSegmentHeader.SegmentType << 24) >>> 0)));
                    }
    
                    for (var i1 = 0, c1 = this.metaDataSegmentHeaders.Count; i1 < c1; i1 = (i1 + 1) | 0) {
                        var metaDataSegmentHeader = this.metaDataSegmentHeaders.getItem(i1);
    
                        tocEntries.add(new JTfy.TOCEntry.ctor(metaDataSegmentHeader.SegmentID, -1, metaDataSegmentHeader.SegmentLength, ((metaDataSegmentHeader.SegmentType << 24) >>> 0)));
                    }
    
                    if (tocEntries.Count === 1) {
                        tocEntries.add(lsgTOCEntry);
                    }
    
                    var tocSegment = new JTfy.TOCSegment.ctor(tocEntries.ToArray());
    
                    var segmentTotalSizeTracker = 0;
    
                    for (var i2 = 0, c2 = tocEntries.Count; i2 < c2; i2 = (i2 + 1) | 0) {
                        var tocEntry = tocEntries.getItem(i2);
    
                        if (i2 > 0 && Bridge.referenceEquals(tocEntry, tocEntries.getItem(((i2 - 1) | 0)))) {
                            continue;
                        }
    
                        tocEntry.SegmentOffset = (((fileHeader.ByteCount + tocSegment.ByteCount) | 0) + segmentTotalSizeTracker) | 0;
    
                        segmentTotalSizeTracker = (segmentTotalSizeTracker + tocEntry.SegmentLength) | 0;
                    }
    
    
    
                    var outputFileStream = new System.IO.MemoryStream.ctor();
                    try {
                        outputFileStream.Write(fileHeader.Bytes, 0, fileHeader.ByteCount);
    
                        outputFileStream.Write(tocSegment.Bytes, 0, tocSegment.ByteCount);
    
                        outputFileStream.Write(lsgSegmentHeader.Bytes, 0, lsgSegmentHeader.ByteCount);
    
                        outputFileStream.Write(lsgSegmentLogicElementHeaderZLIB.Bytes, 0, lsgSegmentLogicElementHeaderZLIB.ByteCount);
    
                        outputFileStream.Write(compressedLSGSegmentData, 0, compressedLSGSegmentData.length);
    
                        for (var i3 = 0, c3 = this.shapeLODSegmentHeaders.Count; i3 < c3; i3 = (i3 + 1) | 0) {
                            var shapeLODSegmentHeader1 = this.shapeLODSegmentHeaders.getItem(i3);
                            var shapeLODSegment = this.shapeLODSegments.getItem(i3);
    
                            outputFileStream.Write(shapeLODSegmentHeader1.Bytes, 0, shapeLODSegmentHeader1.ByteCount);
                            outputFileStream.Write(shapeLODSegment.Bytes, 0, shapeLODSegment.ByteCount);
                        }
    
                        for (var i4 = 0, c4 = this.metaDataSegmentHeaders.Count; i4 < c4; i4 = (i4 + 1) | 0) {
                            var metaDataSegmentHeader1 = this.metaDataSegmentHeaders.getItem(i4);
                            var metaDataSegmentHeaderZLIB = this.metaDataSegmentHeadersZLIB.getItem(i4);
                            var compressedMetaDataSegment = this.compressedMetaDataSegments.getItem(i4);
    
                            outputFileStream.Write(metaDataSegmentHeader1.Bytes, 0, metaDataSegmentHeader1.ByteCount);
                            outputFileStream.Write(metaDataSegmentHeaderZLIB.Bytes, 0, metaDataSegmentHeaderZLIB.ByteCount);
                            outputFileStream.Write(compressedMetaDataSegment, 0, compressedMetaDataSegment.length);
                        }
    
                        return outputFileStream.ToArray();
                    }
                    finally {
                        if (Bridge.hasValue(outputFileStream)) {
                            outputFileStream.System$IDisposable$Dispose();
                        }
                    }
    
    
                },
                CreateElement: function (node) {
                    var $t, $t1;
                    if (node.ReferencedFile != null) {
                        var partitionElement;
    
                        if (this.savedFileIds.containsKey(node.ID)) {
                            partitionElement = this.savedFileIds.getItem(node.ID);
                        } else {
    
    
                            partitionElement = ($t = new JTfy.PartitionNodeElement.ctor(JTfy.IdGenUtils.NextId), $t.FileName = new JTfy.MbString.$ctor2(node.ReferencedFile), $t);
    
                            this.elements.add(partitionElement);
    
                            this.savedFileIds.setItem(node.ID, partitionElement);
                        }
    
                        var instanceElement = new JTfy.InstanceNodeElement.ctor(partitionElement.ObjectId, JTfy.IdGenUtils.NextId);
    
                        this.elements.add(instanceElement);
    
                        this.ProcessAttributes(($t = new JTfy.JTNode.$ctor1(node), $t.GeometricSets = null, $t), instanceElement.ObjectId);
    
    
                        if (node.TransformationMatrix != null) {
                            var transformationMatrixAsString = Bridge.toArray(node.TransformationMatrix).join("|");
    
                            var geometricTransformAttributeElementId;
    
                            if (this.uniqueAttributeIds.containsKey(transformationMatrixAsString)) {
                                geometricTransformAttributeElementId = this.uniqueAttributeIds.getItem(transformationMatrixAsString);
                            } else {
                                geometricTransformAttributeElementId = JTfy.IdGenUtils.NextId;
                                this.uniqueAttributeIds.setItem(transformationMatrixAsString, geometricTransformAttributeElementId);
                                this.elements.add(new JTfy.GeometricTransformAttributeElement.$ctor1(node.TransformationMatrix, geometricTransformAttributeElementId));
                            }
    
                            instanceElement.AttributeObjectIds.add(geometricTransformAttributeElementId);
                        }
    
    
                        return instanceElement;
                    }
    
    
                    var childNodes = node.Children;
                    var childNodesCount = childNodes.Count;
                    var childNodeObjectIds = new (System.Collections.Generic.List$1(System.Int32)).$ctor2(childNodesCount);
    
                    for (var i = 0; i < childNodesCount; i = (i + 1) | 0) {
                        childNodeObjectIds.add(this.CreateElement(childNodes.getItem(i)).ObjectId);
                    }
    
    
    
    
    
                    var nodeElement = node.GeometricSets.length > 0 ? new JTfy.PartNodeElement.ctor(JTfy.IdGenUtils.NextId) : new JTfy.MetaDataNodeElement.ctor(JTfy.IdGenUtils.NextId);
    
                    nodeElement.ChildNodeObjectIds = childNodeObjectIds;
    
    
    
    
    
                    if (node.TransformationMatrix != null) {
                        var transformationMatrixAsString1 = Bridge.toArray(node.TransformationMatrix).join("|");
    
                        var geometricTransformAttributeElementId1;
    
                        if (this.uniqueAttributeIds.containsKey(transformationMatrixAsString1)) {
                            geometricTransformAttributeElementId1 = this.uniqueAttributeIds.getItem(transformationMatrixAsString1);
                        } else {
                            geometricTransformAttributeElementId1 = JTfy.IdGenUtils.NextId;
                            this.uniqueAttributeIds.setItem(transformationMatrixAsString1, geometricTransformAttributeElementId1);
                            this.elements.add(new JTfy.GeometricTransformAttributeElement.$ctor1(node.TransformationMatrix, geometricTransformAttributeElementId1));
                        }
    
                        nodeElement.AttributeObjectIds.add(geometricTransformAttributeElementId1);
                    }
    
    
    
    
    
                    var geometricSetsCount = node.geometricSets.length;
    
                    if (geometricSetsCount > 0) {
                        var x = 0, y = 0, z = 0;
                        var count = 0;
    
                        var groupNodeElement = new JTfy.GroupNodeElement.ctor(JTfy.IdGenUtils.NextId);
                        this.elements.add(groupNodeElement);
    
                        for (var i1 = 0; i1 < geometricSetsCount; i1 = (i1 + 1) | 0) {
                            var geometricSet = ($t = node.GeometricSets)[System.Array.index(i1, $t)];
                            var colour = geometricSet.Colour;
                            var colourAsString = Bridge.toString(colour);
    
                            var materialAttributeElementId = { };
    
                            if (this.uniqueAttributeIds.containsKey(colourAsString)) {
                                materialAttributeElementId.v = this.uniqueAttributeIds.getItem(colourAsString);
                            } else {
                                materialAttributeElementId.v = JTfy.IdGenUtils.NextId;
                                this.uniqueAttributeIds.setItem(colourAsString, materialAttributeElementId.v);
                                this.elements.add(new JTfy.MaterialAttributeElement.ctor(colour, materialAttributeElementId.v));
                            }
    
                            var triStripSetShapeNodeElement = ($t1 = new JTfy.TriStripSetShapeNodeElement.ctor(geometricSet, JTfy.IdGenUtils.NextId), $t1.AttributeObjectIds = (function ($me, materialAttributeElementId) {
                                    return function (_o1) {
                                        _o1.add(materialAttributeElementId.v);
                                        return _o1;
                                    };
                                })(this, materialAttributeElementId)(new (System.Collections.Generic.List$1(System.Int32)).ctor()), $t1);
    
                            this.elements.add(triStripSetShapeNodeElement);
    
                            groupNodeElement.ChildNodeObjectIds.add(triStripSetShapeNodeElement.ObjectId);
    
                            x += geometricSet.Center.X;
                            y += geometricSet.Center.Y;
                            z += geometricSet.Center.Z;
                            count = (count + 1) | 0;
    
                            this.ProcessAttributes(($t1 = new JTfy.JTNode.ctor(), $t1.GeometricSets = System.Array.init([geometricSet], JTfy.GeometricSet), $t1), triStripSetShapeNodeElement.ObjectId);
                        }
    
                        var rangeLODNodeElement = ($t1 = new JTfy.RangeLODNodeElement.ctor(JTfy.IdGenUtils.NextId), $t1.ChildNodeObjectIds = function (_o2) {
                                _o2.add(groupNodeElement.ObjectId);
                                return _o2;
                            }(new (System.Collections.Generic.List$1(System.Int32)).ctor()), $t1.Center = new JTfy.CoordF32.$ctor2(x / count, y / count, z / count), $t1);
    
                        this.elements.add(rangeLODNodeElement);
    
                        nodeElement.ChildNodeObjectIds.add(rangeLODNodeElement.ObjectId);
                    }
    
    
    
    
    
                    if (Bridge.referenceEquals(node, this)) {
                        var area = 0;
    
                        var vertexCountMin = 0, vertexCountMax = 0, nodeCountMin = 0, nodeCountMax = 0, polygonCountMin = 0, polygonCountMax = 0;
    
                        var minX = 0, minY = 0, minZ = 0, maxX = 0, maxY = 0, maxZ = 0;
    
                        var firstTriStripSetShapeNodeElementVisited = false;
    
                        var triStripSetShapeNodeElementType = JTfy.TriStripSetShapeNodeElement;
                        var partitionNodeElementType = JTfy.PartitionNodeElement;
    
                        for (var elementIndex = 0, elementCount = this.elements.Count; elementIndex < elementCount; elementIndex = (elementIndex + 1) | 0) {
                            var element = this.elements.getItem(elementIndex);
                            var elementType = Bridge.getType(element);
    
                            if ((this.monolithic && !Bridge.referenceEquals(elementType, triStripSetShapeNodeElementType)) || (!this.monolithic && !Bridge.referenceEquals(elementType, partitionNodeElementType))) {
                                continue;
                            }
    
                            var vertexCountRange, nodeCountRange, polygonCountRange;
                            var untransformedBBox;
    
                            if (this.monolithic) {
                                var triStripSetShapeNodeElement1 = Bridge.cast(element, JTfy.TriStripSetShapeNodeElement);
    
                                area += triStripSetShapeNodeElement1.Area;
    
                                vertexCountRange = triStripSetShapeNodeElement1.VertexCountRange;
                                nodeCountRange = triStripSetShapeNodeElement1.NodeCountRange;
                                polygonCountRange = triStripSetShapeNodeElement1.PolygonCountRange;
    
                                untransformedBBox = triStripSetShapeNodeElement1.UntransformedBBox;
                            } else {
                                var childPartitionNodeElement = Bridge.cast(element, JTfy.PartitionNodeElement);
    
                                area += childPartitionNodeElement.Area;
    
                                vertexCountRange = childPartitionNodeElement.VertexCountRange;
                                nodeCountRange = childPartitionNodeElement.NodeCountRange;
                                polygonCountRange = childPartitionNodeElement.PolygonCountRange;
    
                                untransformedBBox = childPartitionNodeElement.UntransformedBBox;
                            }
    
                            vertexCountMin = (vertexCountMin + vertexCountRange.Min) | 0;
                            vertexCountMax = (vertexCountMax + vertexCountRange.Max) | 0;
    
                            nodeCountMin = (nodeCountMin + nodeCountRange.Min) | 0;
                            nodeCountMax = (nodeCountMax + nodeCountRange.Max) | 0;
    
                            polygonCountMin = (polygonCountMin + polygonCountRange.Min) | 0;
                            polygonCountMax = (polygonCountMax + polygonCountRange.Max) | 0;
    
                            var minCorner = untransformedBBox.MinCorner;
                            var maxCorner = untransformedBBox.MaxCorner;
    
                            if (!firstTriStripSetShapeNodeElementVisited) {
                                minX = minCorner.X;
                                minY = minCorner.Y;
                                minZ = minCorner.Z;
    
                                maxX = maxCorner.X;
                                maxY = maxCorner.Y;
                                maxZ = maxCorner.Z;
    
                                firstTriStripSetShapeNodeElementVisited = true;
                            } else {
                                if (minCorner.X < minX) {
                                    minX = minCorner.X;
                                }
                                if (minCorner.Y < minY) {
                                    minY = minCorner.Y;
                                }
                                if (minCorner.Z < minZ) {
                                    minZ = minCorner.Z;
                                }
    
                                if (maxCorner.X > maxX) {
                                    maxX = maxCorner.X;
                                }
                                if (maxCorner.Y > maxY) {
                                    maxY = maxCorner.Y;
                                }
                                if (maxCorner.Z > maxZ) {
                                    maxZ = maxCorner.Z;
                                }
                            }
                        }
    
                        var partitionNodeElement = ($t1 = new JTfy.PartitionNodeElement.ctor(JTfy.IdGenUtils.NextId), $t1.ChildNodeObjectIds = function (_o3) {
                                _o3.add(nodeElement.ObjectId);
                                return _o3;
                            }(new (System.Collections.Generic.List$1(System.Int32)).ctor()), $t1.Area = area, $t1.VertexCountRange = new JTfy.CountRange.$ctor2(vertexCountMin, vertexCountMax), $t1.NodeCountRange = new JTfy.CountRange.$ctor2(nodeCountMin, nodeCountMax), $t1.PolygonCountRange = new JTfy.CountRange.$ctor2(polygonCountMin, polygonCountMax), $t1.UntransformedBBox = new JTfy.BBoxF32.$ctor3(minX, minY, minZ, maxX, maxY, maxZ), $t1);
    
                        this.elements.insert(0, partitionNodeElement);
    
                        this.ProcessAttributes(node, partitionNodeElement.ObjectId);
                    }
    
    
                    this.elements.add(nodeElement);
    
                    this.ProcessAttributes(node, nodeElement.ObjectId);
    
                    return nodeElement;
                },
                ProcessAttributes: function (node, nodeElementId) {
                    var $t, $t1, $t2, $t3;
                    var attributes = new (System.Collections.Generic.Dictionary$2(System.String,System.Object)).$ctor4(node.Attributes.Count);
    
                    /* node.Attributes.forEach((value, key, map) =>
                    {
                       while (key.EndsWith(":")) key = key.Substring(0, key.Length - 1);
                       while (key.Contains("::")) key = key.Replace("::", ":");
    
                       if (key.Length == 0) return;
    
                       attributes[key + "::"] = value;
                    });*/
    
                    $t = Bridge.getEnumerator(node.Attributes);
                    try {
                        while ($t.moveNext()) {
                            var attribute = $t.Current;
                            var key = attribute.key.trim();
                            var value = attribute.value;
    
                            while (System.String.endsWith(key, ":")) {
                                key = key.substr(0, ((key.length - 1) | 0));
                            }
                            while (System.String.contains(key,"::")) {
                                key = System.String.replaceAll(key, "::", ":");
                            }
    
                            if (key.length === 0) {
                                continue;
                            }
    
                            attributes.setItem((key || "") + "::", value);
                        }
                    } finally {
                        if (Bridge.is($t, System.IDisposable)) {
                            $t.System$IDisposable$Dispose();
                        }
                    }
    
                    if (this.separateAttributeSegments) {
                        var metaDataSegmentHeader = this.GetMetaDataSegmentHeader(($t1 = new JTfy.JTNode.ctor(), $t1.Attributes = attributes, $t1));
    
                        attributes.clear();
    
                        if (metaDataSegmentHeader != null) {
                            attributes.setItem("JT_LLPROP_METADATA", metaDataSegmentHeader);
                        }
                    }
    
                    attributes.setItem("JT_PROP_MEASUREMENT_UNITS", node.MeasurementUnitAsString);
    
                    if (node.Number != null || node.Name != null) {
                        attributes.setItem("JT_PROP_NAME", ((System.Linq.Enumerable.from(System.Array.init([node.Number, node.Name], System.String), System.String).where(function (v) {
                                return v != null;
                            }).ToArray(System.String)).join(" - ") || "") + "." + ((node.Children.Count > 0 ? "asm" : "part") || "") + ";0;0:");
                    }
    
    
                    if (node.GeometricSets.length > 0) {
                        attributes.setItem("JT_LLPROP_SHAPEIMPL", node.GeometricSets);
                    }
    
                    var attributesCount = attributes.Count;
    
                    var keys = new (System.Collections.Generic.List$1(System.Int32)).$ctor2(attributesCount);
                    var values = new (System.Collections.Generic.List$1(System.Int32)).$ctor2(attributesCount);
    
                    $t1 = Bridge.getEnumerator(attributes);
                    try {
                        while ($t1.moveNext()) {
                            var attribute1 = $t1.Current;
                            var key1 = attribute1.key;
    
                            var value1 = attribute1.value;
                            var valueTypeName = Bridge.Reflection.getTypeName(Bridge.getType(value1));
    
                            if (!Bridge.referenceEquals(valueTypeName, "String") && !Bridge.referenceEquals(valueTypeName, "Int32") && !Bridge.referenceEquals(valueTypeName, "Single") && !Bridge.referenceEquals(valueTypeName, "DateTime") && !Bridge.referenceEquals(valueTypeName, "GeometricSet[]") && !Bridge.referenceEquals(valueTypeName, "SegmentHeader")) {
                                throw new System.Exception(System.String.format("Only String, Int32, Single, DateTime, GeometricSet[] and SegmentHeader value types are allowed. Current value is {0}.", [valueTypeName]));
                            }
    
                            var keyLookupKey = System.String.format("{0}-{1}", Bridge.Reflection.getTypeName(Bridge.getType(key1, System.String)), key1);
    
                            var keyId;
    
                            if (this.uniquePropertyIds.containsKey(keyLookupKey)) {
                                keyId = this.uniquePropertyIds.getItem(keyLookupKey);
                            } else {
                                keyId = JTfy.IdGenUtils.NextId;
                                this.propertyAtomElements.add(new JTfy.StringPropertyAtomElement.$ctor2(key1, keyId));
                                this.uniquePropertyIds.setItem(keyLookupKey, keyId);
                            }
    
                            keys.add(keyId);
    
                            var valueAsString = !Bridge.referenceEquals(valueTypeName, "GeometricSet[]") ? Bridge.toString(value1) : ($t2 = Bridge.cast((value1), System.Array.type(JTfy.GeometricSet)))[System.Array.index(0, $t2)].toString();
                            var valueLookupKey = (valueTypeName || "") + "-" + (valueAsString || "");
    
                            var valueId;
    
                            if (this.uniquePropertyIds.containsKey(valueLookupKey)) {
                                valueId = this.uniquePropertyIds.getItem(valueLookupKey);
                            } else {
                                valueId = JTfy.IdGenUtils.NextId;
                                this.uniquePropertyIds.setItem(valueLookupKey, valueId);
    
                                switch (valueTypeName) {
                                    case "String": 
                                        this.propertyAtomElements.add(new JTfy.StringPropertyAtomElement.$ctor2(Bridge.cast(value1, System.String), valueId));
                                        break;
                                    case "Int32": 
                                        this.propertyAtomElements.add(new JTfy.IntegerPropertyAtomElement.ctor(System.Nullable.getValue(Bridge.cast(Bridge.unbox(value1, System.Int32), System.Int32)), valueId));
                                        break;
                                    case "Single": 
                                        this.propertyAtomElements.add(new JTfy.FloatingPointPropertyAtomElement.$ctor1(System.Nullable.getValue(Bridge.cast(Bridge.unbox(value1, System.Single), System.Single)), valueId));
                                        break;
                                    case "DateTime": 
                                        this.propertyAtomElements.add(new JTfy.DatePropertyAtomElement.$ctor1(System.Nullable.getValue(Bridge.cast(Bridge.unbox(value1, System.DateTime), System.DateTime)), valueId));
                                        break;
                                    case "GeometricSet[]": 
                                        var geometricSet = ($t3 = Bridge.cast(value1, System.Array.type(JTfy.GeometricSet)))[System.Array.index(0, $t3)];
                                        var shapeLODSegment = new JTfy.ShapeLODSegment.ctor(new JTfy.TriStripSetShapeLODElement.$ctor1(geometricSet.TriStrips, geometricSet.Positions, geometricSet.Normals));
                                        var shapeLODSegmentHeader = new JTfy.SegmentHeader.ctor(JTfy.GUID.NewGUID(), 6, ((JTfy.SegmentHeader.Size + shapeLODSegment.ByteCount) | 0));
                                        this.shapeLODSegments.add(shapeLODSegment);
                                        this.shapeLODSegmentHeaders.add(shapeLODSegmentHeader);
                                        this.propertyAtomElements.add(new JTfy.LateLoadedPropertyAtomElement.ctor(shapeLODSegmentHeader.SegmentID, shapeLODSegmentHeader.SegmentType, valueId));
                                        break;
                                    case "SegmentHeader": 
                                        var segmentHeader = Bridge.cast(value1, JTfy.SegmentHeader);
                                        this.propertyAtomElements.add(new JTfy.LateLoadedPropertyAtomElement.ctor(segmentHeader.SegmentID, segmentHeader.SegmentType, valueId));
                                        break;
                                }
                            }
    
                            values.add(valueId);
                        }
                    } finally {
                        if (Bridge.is($t1, System.IDisposable)) {
                            $t1.System$IDisposable$Dispose();
                        }
                    }
    
                    this.propertyTableContents.add(nodeElementId, new JTfy.NodePropertyTable.ctor(keys, values));
                },
                GetMetaDataSegmentHeader: function (node) {
                    if (this.uniqueMetaDataSegmentHeaders.containsKey(node)) {
                        return this.uniqueMetaDataSegmentHeaders.getItem(node);
                    }
    
                    var attributes = node.Attributes;
    
                    if (attributes.Count === 0) {
                        return null;
                    }
    
                    var keys = new (System.Collections.Generic.List$1(System.String)).$ctor1(attributes.Keys);
                    var values = new (System.Collections.Generic.List$1(System.Object)).$ctor1(attributes.Values);
    
                    var metaDataSegment = new JTfy.MetaDataSegment.ctor(new JTfy.PropertyProxyMetaDataElement.ctor(keys, values));
                    var compressedMetaDataSegment = JTfy.CompressionUtils.Compress(metaDataSegment.Bytes);
                    var metaDataSegmentHeaderZLIB = new JTfy.LogicElementHeaderZLIB.ctor(2, ((compressedMetaDataSegment.length + 1) | 0), 2);
                    var metaDataSegmentHeader = new JTfy.SegmentHeader.ctor(JTfy.GUID.NewGUID(), 4, ((((JTfy.SegmentHeader.Size + metaDataSegmentHeaderZLIB.ByteCount) | 0) + compressedMetaDataSegment.length) | 0));
    
                    this.uniqueMetaDataSegmentHeaders.setItem(node, metaDataSegmentHeader);
    
                    this.compressedMetaDataSegments.add(compressedMetaDataSegment);
                    this.metaDataSegmentHeadersZLIB.add(metaDataSegmentHeaderZLIB);
                    this.metaDataSegmentHeaders.add(metaDataSegmentHeader);
    
                    return metaDataSegmentHeader;
                }
            }
        });
    
        Bridge.define("JTfy.JTNode.MeasurementUnits", {
            $kind: "nested enum",
            statics: {
                fields: {
                    Millimeters: 0,
                    Centimeters: 1,
                    Meters: 2,
                    Inches: 3,
                    Feet: 4,
                    Yards: 5,
                    Micrometers: 6,
                    Decimeters: 7,
                    Kilometers: 8,
                    Mils: 9,
                    Miles: 10
                }
            }
        });
    
        Bridge.define("JTfy.Point3D", {
            fields: {
                X: 0,
                Y: 0,
                Z: 0
            },
            ctors: {
                ctor: function (x, y, z) {
                    this.$initialize();
                    this.X = x;
                    this.Y = y;
                    this.Z = z;
                }
            }
        });
    
        Bridge.define("JTfy.PropertyTable", {
            fields: {
                VersionNumber: 0,
                NodePropertyTableCount: 0,
                NodeObjectIDs: null,
                NodePropertyTables: null
            },
            props: {
                ByteCount: {
                    get: function () {
                        var $t;
                        var size = (6 + Bridge.Int.mul(this.NodePropertyTableCount, 4)) | 0;
    
                        $t = Bridge.getEnumerator(this.NodePropertyTables);
                        try {
                            while ($t.moveNext()) {
                                var elementPropertyTable = $t.Current;
                                size = (size + elementPropertyTable.ByteCount) | 0;
                            }
                        } finally {
                            if (Bridge.is($t, System.IDisposable)) {
                                $t.System$IDisposable$Dispose();
                            }
                        }
    
                        return size;
                    }
                },
                Bytes: {
                    get: function () {
                        var $t, $t1;
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$2(this.VersionNumber));
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.NodePropertyTableCount));
    
                        for (var i = 0; i < this.NodePropertyTableCount; i = (i + 1) | 0) {
                            bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(($t = this.NodeObjectIDs)[System.Array.index(i, $t)]));
                            bytesList.AddRange(($t1 = this.NodePropertyTables)[System.Array.index(i, $t1)].Bytes);
                        }
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (elementObjectIDs, elementPropertyTables) {
                    this.$initialize();
                    this.VersionNumber = 1;
                    this.NodePropertyTableCount = elementObjectIDs.length;
                    this.NodeObjectIDs = elementObjectIDs;
                    this.NodePropertyTables = elementPropertyTables;
                },
                $ctor1: function (stream) {
                    var $t, $t1;
                    this.$initialize();
                    this.VersionNumber = JTfy.StreamUtils.ReadInt16(stream);
                    this.NodePropertyTableCount = JTfy.StreamUtils.ReadInt32(stream);
    
                    this.NodeObjectIDs = System.Array.init(this.NodePropertyTableCount, 0, System.Int32);
                    this.NodePropertyTables = System.Array.init(this.NodePropertyTableCount, null, JTfy.NodePropertyTable);
    
                    for (var i = 0; i < this.NodePropertyTableCount; i = (i + 1) | 0) {
                        ($t = this.NodeObjectIDs)[System.Array.index(i, $t)] = JTfy.StreamUtils.ReadInt32(stream);
                        ($t1 = this.NodePropertyTables)[System.Array.index(i, $t1)] = new JTfy.NodePropertyTable.$ctor1(stream);
                    }
                }
            }
        });
    
        Bridge.define("JTfy.RandomGenUtils", {
            statics: {
                fields: {
                    random: null
                },
                ctors: {
                    init: function () {
                        this.random = new System.Random.ctor();
                    }
                },
                methods: {
                    NextDouble: function (min, max) {
                        var bytes = System.Array.init(8, 0, System.Byte);
    
                        JTfy.RandomGenUtils.random.NextBytes(bytes);
    
    
                        var uLongArray = System.Array.init([System.BitConverter.toUInt64(bytes, 0)], System.UInt64);
    
                        var randomValue = uLongArray[System.Array.index(0, uLongArray)] / System.UInt64.MaxValue;
    
                        var result = randomValue * (max - min) + min;
    
                        return result;
                    },
                    NextColour: function () {
                        var minSV = 0.4;
    
                        var h = JTfy.RandomGenUtils.NextDouble(0, 360);
                        var s = JTfy.RandomGenUtils.NextDouble(minSV, 1);
                        var v = JTfy.RandomGenUtils.NextDouble(minSV, 1);
    
                        return JTfy.ColourUtils.HSV2RGB(h, s, v);
                    }
                }
            }
        });
    
        Bridge.define("JTfy.StreamUtils", {
            statics: {
                fields: {
                    DataIsLittleEndian: false,
                    typeSizesInBytes: null
                },
                ctors: {
                    init: function () {
                        this.typeSizesInBytes = function (_o1) {
                                _o1.add(System.Byte, 1);
                                _o1.add(System.UInt16, 2);
                                _o1.add(System.Int16, 2);
                                _o1.add(System.UInt32, 4);
                                _o1.add(System.Int32, 4);
                                _o1.add(System.Single, 4);
                                _o1.add(System.UInt64, 8);
                                _o1.add(System.Int64, 8);
                                _o1.add(System.Double, 8);
                                return _o1;
                            }(new (System.Collections.Generic.Dictionary$2(System.Type,System.Byte)).ctor());
                    }
                },
                methods: {
                    ReadBytes: function (stream, numberOfBytesToRead, checkEndianness) {
                        if (checkEndianness === void 0) { checkEndianness = true; }
                        var buffer = System.Array.init(numberOfBytesToRead, 0, System.Byte);
    
                        stream.Read(buffer, 0, numberOfBytesToRead);
    
                        if (checkEndianness && System.BitConverter.isLittleEndian !== JTfy.StreamUtils.DataIsLittleEndian) {
                            System.Array.reverse(buffer);
                        }
    
                        return buffer;
                    },
                    GetSizeInBytes: function (type) {
                        var returnValue = { };
                        if (JTfy.StreamUtils.typeSizesInBytes.tryGetValue(type, returnValue)) {
                            return returnValue.v;
                        }
    
                        throw new System.Exception(System.String.format("Only Byte, UInt16, UInt32, UInt64, Int16, Int32, Int64, Single and Double types are allowed. Current type is {0}.", [Bridge.Reflection.getTypeName(type)]));
                    },
                    Read: function (T, stream) {
                        var type = T;
    
                        var numberOfBytesToRead = JTfy.StreamUtils.GetSizeInBytes(type);
    
                        var bytes = JTfy.StreamUtils.ReadBytes(stream, numberOfBytesToRead);
    
    
    
    
                        if (Bridge.referenceEquals(type, System.Byte)) {
                            return Bridge.cast(Bridge.unbox(Bridge.box(bytes[System.Array.index(0, bytes)], System.Byte), T), T);
                        }
    
                        if (Bridge.referenceEquals(type, System.UInt16)) {
                            return Bridge.cast(Bridge.unbox(Bridge.box(System.BitConverter.toUInt16(bytes, 0), System.UInt16), T), T);
                        }
                        if (Bridge.referenceEquals(type, System.UInt32)) {
                            return Bridge.cast(Bridge.unbox(Bridge.box(System.BitConverter.toUInt32(bytes, 0), System.UInt32), T), T);
                        }
                        if (Bridge.referenceEquals(type, System.UInt64)) {
                            return Bridge.cast(Bridge.unbox(System.BitConverter.toUInt64(bytes, 0), T), T);
                        }
    
                        if (Bridge.referenceEquals(type, System.Int16)) {
                            return Bridge.cast(Bridge.unbox(Bridge.box(System.BitConverter.toInt16(bytes, 0), System.Int16), T), T);
                        }
                        if (Bridge.referenceEquals(type, System.Int32)) {
                            return Bridge.cast(Bridge.unbox(Bridge.box(System.BitConverter.toInt32(bytes, 0), System.Int32), T), T);
                        }
                        if (Bridge.referenceEquals(type, System.Int64)) {
                            return Bridge.cast(Bridge.unbox(System.BitConverter.toInt64(bytes, 0), T), T);
                        }
    
                        if (Bridge.referenceEquals(type, System.Single)) {
                            return Bridge.cast(Bridge.unbox(Bridge.box(System.BitConverter.toSingle(bytes, 0), System.Single, System.Single.format, System.Single.getHashCode), T), T);
                        }
                        if (Bridge.referenceEquals(type, System.Double)) {
                            return Bridge.cast(Bridge.unbox(Bridge.box(System.BitConverter.toDouble(bytes, 0), System.Double, System.Double.format, System.Double.getHashCode), T), T);
                        }
    
                        throw new System.Exception(System.String.format("Only Byte, UInt16, UInt32, UInt64, Int16, Int32, Int64, Single and Double types are allowed. Current type is {0}.", [Bridge.Reflection.getTypeName(type)]));
                    },
                    ReadByte: function (stream) {
                        return JTfy.StreamUtils.Read(System.Byte, stream);
                    },
                    ReadUInt16: function (stream) {
                        return JTfy.StreamUtils.Read(System.UInt16, stream);
                    },
                    ReadUInt32: function (stream) {
                        return JTfy.StreamUtils.Read(System.UInt32, stream);
                    },
                    ReadUInt64: function (stream) {
                        return JTfy.StreamUtils.Read(System.UInt64, stream);
                    },
                    ReadInt16: function (stream) {
                        return JTfy.StreamUtils.Read(System.Int16, stream);
                    },
                    ReadInt32: function (stream) {
                        return JTfy.StreamUtils.Read(System.Int32, stream);
                    },
                    ReadInt64: function (stream) {
                        return JTfy.StreamUtils.Read(System.Int64, stream);
                    },
                    ReadFloat: function (stream) {
                        return JTfy.StreamUtils.Read(System.Single, stream);
                    },
                    ReadDouble: function (stream) {
                        return JTfy.StreamUtils.Read(System.Double, stream);
                    },
                    ToBytes$9: function (T, value) {
    
    
    
                        var bytes = Bridge.cast((Bridge.Reflection.midel(Bridge.Reflection.getMembers(System.BitConverter, 8, 284, "GetBytes", System.Array.init([T], System.Type)), null)(System.Array.init([value], T))), System.Array.type(System.Byte));
    
                        if (JTfy.StreamUtils.DataIsLittleEndian !== System.BitConverter.isLittleEndian) {
                            System.Array.reverse(bytes);
                        }
    
                        return bytes;
                    },
                    ToBytes: function (value) {
                        return System.Array.init([value], System.Byte);
                    },
                    ToBytes$6: function (value) {
                        return JTfy.StreamUtils.CheckEndianness(System.BitConverter.getBytes$7(value));
                    },
                    ToBytes$2: function (value) {
                        return JTfy.StreamUtils.CheckEndianness(System.BitConverter.getBytes$3(value));
                    },
                    ToBytes$7: function (value) {
                        return JTfy.StreamUtils.CheckEndianness(System.BitConverter.getBytes$8(value));
                    },
                    ToBytes$3: function (value) {
                        return JTfy.StreamUtils.CheckEndianness(System.BitConverter.getBytes$4(value));
                    },
                    ToBytes$5: function (value) {
                        return JTfy.StreamUtils.CheckEndianness(System.BitConverter.getBytes$6(value));
                    },
                    ToBytes$8: function (value) {
                        return JTfy.StreamUtils.CheckEndianness(System.BitConverter.getBytes$9(value));
                    },
                    ToBytes$4: function (value) {
                        return JTfy.StreamUtils.CheckEndianness(System.BitConverter.getBytes$5(value));
                    },
                    ToBytes$1: function (value) {
                        return JTfy.StreamUtils.CheckEndianness(System.BitConverter.getBytes$2(value));
                    },
                    CheckEndianness: function (bytes) {
                        if (JTfy.StreamUtils.DataIsLittleEndian !== System.BitConverter.isLittleEndian) {
                            System.Array.reverse(bytes);
                        }
                        return bytes;
                    }
                }
            }
        });
    
        Bridge.define("JTfy.BaseAttributeElement", {
            inherits: [JTfy.BaseDataStructure],
            fields: {
                ObjectId: 0,
                StateFlags: 0,
                FieldInhibitFlags: 0
            },
            props: {
                ByteCount: {
                    get: function () {
                        return 9;
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.ObjectId));
                        bytesList.add(this.StateFlags);
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$7(this.FieldInhibitFlags));
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (objectId) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.ObjectId = objectId;
                    this.StateFlags = 0;
                    this.FieldInhibitFlags = 0;
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.ObjectId = JTfy.StreamUtils.ReadInt32(stream);
                    this.StateFlags = JTfy.StreamUtils.ReadByte(stream);
                    this.FieldInhibitFlags = JTfy.StreamUtils.ReadUInt32(stream);
                }
            }
        });
    
        Bridge.define("JTfy.BaseNodeElement", {
            inherits: [JTfy.BaseDataStructure],
            fields: {
                ObjectId: 0,
                NodeFlags: 0,
                attributeObjectIds: null
            },
            props: {
                AttributeCount: {
                    get: function () {
                        return this.AttributeObjectIds.Count;
                    }
                },
                AttributeObjectIds: {
                    get: function () {
                        return this.attributeObjectIds;
                    },
                    set: function (value) {
                        this.attributeObjectIds = value || new (System.Collections.Generic.List$1(System.Int32)).ctor();
                    }
                },
                ByteCount: {
                    get: function () {
                        return ((12 + Bridge.Int.mul(this.AttributeCount, 4)) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.ObjectId));
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$7(this.NodeFlags));
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.AttributeCount));
    
                        for (var i = 0; i < this.AttributeCount; i = (i + 1) | 0) {
                            bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.AttributeObjectIds.getItem(i)));
                        }
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                init: function () {
                    this.attributeObjectIds = new (System.Collections.Generic.List$1(System.Int32)).ctor();
                },
                ctor: function (objectId) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.ObjectId = objectId;
                    this.NodeFlags = 0;
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.ObjectId = JTfy.StreamUtils.ReadInt32(stream);
                    this.NodeFlags = JTfy.StreamUtils.ReadUInt32(stream);
    
                    var attributeCount = JTfy.StreamUtils.ReadInt32(stream);
                    this.AttributeObjectIds = new (System.Collections.Generic.List$1(System.Int32)).$ctor2(attributeCount);
    
                    for (var i = 0; i < attributeCount; i = (i + 1) | 0) {
                        this.AttributeObjectIds.add(JTfy.StreamUtils.ReadInt32(stream));
                    }
                }
            }
        });
    
        Bridge.define("JTfy.BasePropertyAtomElement", {
            inherits: [JTfy.BaseDataStructure],
            fields: {
                ObjectID: 0,
                StateFlags: 0
            },
            props: {
                ByteCount: {
                    get: function () {
                        return 8;
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.ObjectID));
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$7(this.StateFlags));
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (objectId) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.ObjectID = objectId;
                    this.StateFlags = 0;
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.ObjectID = JTfy.StreamUtils.ReadInt32(stream);
                    this.StateFlags = JTfy.StreamUtils.ReadUInt32(stream);
                }
            }
        });
    
        Bridge.define("JTfy.BBoxF32", {
            inherits: [JTfy.BaseDataStructure],
            fields: {
                MinCorner: null,
                MaxCorner: null
            },
            props: {
                ByteCount: {
                    get: function () {
                        return Bridge.Int.mul(2, this.MaxCorner.ByteCount);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(this.MinCorner.Bytes);
                        bytesList.AddRange(this.MaxCorner.Bytes);
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                $ctor2: function (stream) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.MinCorner = new JTfy.CoordF32.$ctor1(stream);
                    this.MaxCorner = new JTfy.CoordF32.$ctor1(stream);
                },
                $ctor1: function (minCorner, maxCorner) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.MinCorner = minCorner;
                    this.MaxCorner = maxCorner;
                },
                ctor: function () {
                    JTfy.BBoxF32.$ctor1.call(this, new JTfy.CoordF32.ctor(), new JTfy.CoordF32.ctor());
                },
                $ctor3: function (xMin, yMin, zMin, xMax, yMax, zMax) {
                    JTfy.BBoxF32.$ctor1.call(this, new JTfy.CoordF32.$ctor2(xMin, yMin, zMin), new JTfy.CoordF32.$ctor2(xMax, yMax, zMax));
                }
            }
        });
    
        Bridge.define("JTfy.DataArray$1", function (T) { return {
            inherits: [JTfy.BaseDataStructure],
            fields: {
                data: null
            },
            props: {
                ByteCount: {
                    get: function () {
                        return Bridge.Int.mul(this.data.length, JTfy.StreamUtils.GetSizeInBytes(T));
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        for (var i = 0, c = this.data.length; i < c; i = (i + 1) | 0) {
                            bytesList.AddRange(JTfy.StreamUtils.ToBytes$9(T, this.data[System.Array.index(i, this.data)]));
                        }
    
                        return bytesList.ToArray();
                    }
                }
            }
        }; });
    
        Bridge.define("JTfy.ElementHeader", {
            inherits: [JTfy.BaseDataStructure],
            statics: {
                props: {
                    Size: {
                        get: function () {
                            return ((((4 + JTfy.GUID.Size) | 0) + 1) | 0);
                        }
                    }
                }
            },
            fields: {
                ElementLength: 0,
                ObjectTypeID: null,
                ObjectBaseType: 0
            },
            props: {
                ByteCount: {
                    get: function () {
                        return JTfy.ElementHeader.Size;
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.ElementLength));
                        bytesList.AddRange(this.ObjectTypeID.Bytes);
                        bytesList.add(this.ObjectBaseType);
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (elementLength, objectTypeID, objectBaseType) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.ElementLength = elementLength;
                    this.ObjectTypeID = objectTypeID;
                    this.ObjectBaseType = objectBaseType;
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.ElementLength = JTfy.StreamUtils.ReadInt32(stream);
                    this.ObjectTypeID = new JTfy.GUID.$ctor1(stream);
    
                    if (!Bridge.referenceEquals(this.ObjectTypeID.toString(), JTfy.ConstUtils.EndOfElementAsString)) {
                        this.ObjectBaseType = JTfy.StreamUtils.ReadByte(stream);
                    }
                }
            }
        });
    
        Bridge.define("JTfy.FileHeader", {
            inherits: [JTfy.BaseDataStructure],
            statics: {
                props: {
                    Size: {
                        get: function () {
                            return ((89 + JTfy.GUID.Size) | 0);
                        }
                    }
                }
            },
            fields: {
                Version: null,
                ByteOrder: 0,
                ReservedField: 0,
                TOCOffset: 0,
                LSGSegmentID: null
            },
            props: {
                VersionAsString: {
                    get: function () {
                        return System.Text.Encoding.ASCII.GetString(this.Version);
                    }
                },
                ByteCount: {
                    get: function () {
                        return JTfy.FileHeader.Size;
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(this.Version);
                        bytesList.add(this.ByteOrder);
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.ReservedField));
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.TOCOffset));
                        bytesList.AddRange(this.LSGSegmentID.Bytes);
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                $ctor1: function (version, byteOrder, tocOffset, lsgSegmentID) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    var versionStringLength = version.length;
    
                    if (versionStringLength > JTfy.ConstUtils.VariantStringRequiredLength || (System.String.endsWith(version, JTfy.ConstUtils.VariantStringEnding) && versionStringLength < JTfy.ConstUtils.VariantStringRequiredLength)) {
                        throw new System.Exception(System.String.format("Version string has to be {0} characters long, currently it is {1} characters long", Bridge.box(JTfy.ConstUtils.VariantStringRequiredLength, System.Int32), Bridge.box(versionStringLength, System.Int32)));
                    } else if (versionStringLength < 76) {
                        version = (System.String.alignString(version, -75, 32) || "") + (JTfy.ConstUtils.VariantStringEnding || "");
                    }
    
                    this.Version = System.Text.Encoding.ASCII.GetBytes$2(version);
                    this.ByteOrder = byteOrder;
    
                    JTfy.StreamUtils.DataIsLittleEndian = this.ByteOrder === 0;
    
                    this.ReservedField = 0;
                    this.TOCOffset = tocOffset;
                    this.LSGSegmentID = lsgSegmentID;
                },
                ctor: function (stream) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.Version = JTfy.StreamUtils.ReadBytes(stream, 80, false);
                    this.ByteOrder = JTfy.StreamUtils.ReadByte(stream);
    
                    JTfy.StreamUtils.DataIsLittleEndian = this.ByteOrder === 0;
    
                    this.ReservedField = JTfy.StreamUtils.ReadInt32(stream);
                    this.TOCOffset = JTfy.StreamUtils.ReadInt32(stream);
                    this.LSGSegmentID = new JTfy.GUID.$ctor1(stream);
                }
            }
        });
    
        Bridge.define("JTfy.GUID", {
            inherits: [JTfy.BaseDataStructure],
            statics: {
                props: {
                    Size: {
                        get: function () {
                            return 16;
                        }
                    }
                },
                methods: {
                    NewGUID: function () {
                        return new JTfy.GUID.ctor(System.Guid.NewGuid());
                    }
                }
            },
            fields: {
                guid: null
            },
            props: {
                ByteCount: {
                    get: function () {
                        return JTfy.GUID.Size;
                    }
                },
                Bytes: {
                    get: function () {
                        var guidStream = new System.IO.MemoryStream.$ctor1(this.guid.ToByteArray());
                        try {
                            var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                            bytesList.AddRange(JTfy.StreamUtils.ReadBytes(guidStream, 4, true));
                            bytesList.AddRange(JTfy.StreamUtils.ReadBytes(guidStream, 2, true));
                            bytesList.AddRange(JTfy.StreamUtils.ReadBytes(guidStream, 2, true));
    
                            bytesList.AddRange(JTfy.StreamUtils.ReadBytes(guidStream, 8, false));
    
                            return bytesList.ToArray();
                        }
                        finally {
                            if (Bridge.hasValue(guidStream)) {
                                guidStream.System$IDisposable$Dispose();
                            }
                        }
                    }
                }
            },
            ctors: {
                init: function () {
                    this.guid = new System.Guid();
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.guid = new System.Guid.$ctor3(JTfy.StreamUtils.ReadInt32(stream), JTfy.StreamUtils.ReadInt16(stream), JTfy.StreamUtils.ReadInt16(stream), JTfy.StreamUtils.ReadBytes(stream, 8, false));
                },
                $ctor2: function (guidString) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    var segments = System.String.split(System.String.replaceAll(System.String.replaceAll(guidString, "{", ""), "}", ""), System.Array.init([44], System.Char).map(function (i) {{ return String.fromCharCode(i); }}));
    
                    this.guid = new System.Guid.$ctor3(System.Convert.toNumberInBase(System.Linq.Enumerable.from(segments, System.String).first(), 16, 9), System.Convert.toNumberInBase(System.Linq.Enumerable.from(segments, System.String).skip(1).first(), 16, 7), System.Convert.toNumberInBase(System.Linq.Enumerable.from(segments, System.String).skip(2).first(), 16, 7), System.Linq.Enumerable.from(segments, System.String).skip(3).select(function (s) {
                        return System.Convert.toNumberInBase(s, 16, 6);
                    }).ToArray(System.Byte));
    
                },
                ctor: function (guid) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.guid = guid;
                }
            },
            methods: {
                toString: function () {
                    return this.guid.ToString("X");
                }
            }
        });
    
        Bridge.define("JTfy.Int32ProbabilityContexts", {
            inherits: [JTfy.BaseDataStructure],
            fields: {
                ProbabilityContextTableEntries: null
            },
            props: {
                ByteCount: {
                    get: function () {
                        throw new System.NotImplementedException.ctor();
                    }
                },
                Bytes: {
                    get: function () {
                        throw new System.NotImplementedException.ctor();
                    }
                }
            }
        });
    
        Bridge.define("JTfy.Int32ProbabilityContextTableEntry", {
            inherits: [JTfy.BaseDataStructure],
            fields: {
                Symbol: 0,
                OccurrenceCount: 0,
                AssociatedValue: 0,
                NextContext: 0
            },
            props: {
                ByteCount: {
                    get: function () {
                        throw new System.NotImplementedException.ctor();
                    }
                },
                Bytes: {
                    get: function () {
                        throw new System.NotImplementedException.ctor();
                    }
                }
            },
            ctors: {
                ctor: function (bitStream, numberOfSymbolBits, numberOfOccurrenceCountBits, numberOfAssociatedValueBits, numberOfNextContextBits, minimumValue) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.Symbol = (bitStream.ReadAsUnsignedInt(numberOfSymbolBits) - 2) | 0;
                    this.OccurrenceCount = bitStream.ReadAsUnsignedInt(numberOfOccurrenceCountBits);
                    this.AssociatedValue = (bitStream.ReadAsUnsignedInt(numberOfAssociatedValueBits) + minimumValue) | 0;
                    this.NextContext = numberOfNextContextBits !== -1 ? bitStream.ReadAsUnsignedInt(numberOfNextContextBits) : 0;
                }
            }
        });
    
        Bridge.define("JTfy.LogicElementHeaderZLIB", {
            inherits: [JTfy.BaseDataStructure],
            fields: {
                CompressionFlag: 0,
                CompressedDataLength: 0,
                CompressionAlgorithm: 0
            },
            props: {
                ByteCount: {
                    get: function () {
                        return 9;
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesArray = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesArray.AddRange(JTfy.StreamUtils.ToBytes$3(this.CompressionFlag));
                        bytesArray.AddRange(JTfy.StreamUtils.ToBytes$3(this.CompressedDataLength));
                        bytesArray.add(this.CompressionAlgorithm);
    
                        return bytesArray.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (compressionFlag, compressedDataLength, compressionAlgorithm) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.CompressionFlag = compressionFlag;
                    this.CompressedDataLength = compressedDataLength;
                    this.CompressionAlgorithm = compressionAlgorithm;
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.CompressionFlag = JTfy.StreamUtils.ReadInt32(stream);
                    this.CompressedDataLength = JTfy.StreamUtils.ReadInt32(stream);
                    this.CompressionAlgorithm = JTfy.StreamUtils.ReadByte(stream);
                }
            }
        });
    
        Bridge.define("JTfy.LosslessCompressedRawVertexData", {
            inherits: [JTfy.BaseDataStructure],
            fields: {
                compressedVertexData: null,
                vertexData: null
            },
            props: {
                UncompressedDataSize: {
                    get: function () {
                        return this.VertexData.length;
                    }
                },
                CompressedDataSize: {
                    get: function () {
                        return this.CompressedVertexData.length;
                    }
                },
                CompressedVertexData: {
                    get: function () {
                        if (this.compressedVertexData == null) {
                            this.compressedVertexData = JTfy.CompressionUtils.Compress(this.vertexData);
                        }
    
                        return this.compressedVertexData;
                    },
                    set: function (value) {
                        this.compressedVertexData = value || (System.Array.init(0, 0, System.Byte));
                    }
                },
                VertexData: {
                    get: function () {
                        if (this.vertexData == null) {
                            this.vertexData = JTfy.CompressionUtils.Decompress(this.compressedVertexData);
                        }
    
                        return this.vertexData;
                    },
                    set: function (value) {
                        this.vertexData = value || (System.Array.init(0, 0, System.Byte));
                    }
                },
                ByteCount: {
                    get: function () {
                        return ((8 + this.CompressedVertexData.length) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.VertexData.length));
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.CompressedVertexData.length));
                        bytesList.AddRange(this.CompressedVertexData);
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (vertexData) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.VertexData = vertexData;
                },
                $ctor1: function (stream) {
                    var $t;
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    JTfy.StreamUtils.ReadInt32(stream);
                    var compressedDataSize = JTfy.StreamUtils.ReadInt32(stream);
    
                    if (compressedDataSize > 0) {
                        this.CompressedVertexData = JTfy.StreamUtils.ReadBytes(stream, compressedDataSize, false);
                    } else {
                        if (compressedDataSize < 0) {
                            this.VertexData = JTfy.StreamUtils.ReadBytes(stream, Math.abs(compressedDataSize), false);
                        } else {
                            this.VertexData = ($t = System.Array.init(0, 0, System.Byte), this.CompressedVertexData = $t, $t);
                        }
                    }
                }
            }
        });
    
        Bridge.define("JTfy.LSGSegment", {
            inherits: [JTfy.BaseDataStructure],
            fields: {
                GraphElements: null,
                PropertyAtomElements: null,
                PropertyTable: null
            },
            props: {
                ByteCount: {
                    get: function () {
                        var elementHeaderByteCount = JTfy.ElementHeader.Size;
    
                        var size = 0;
    
                        for (var i = 0, c = this.GraphElements.Count; i < c; i = (i + 1) | 0) {
                            size = (size + (((elementHeaderByteCount + this.GraphElements.getItem(i).ByteCount) | 0))) | 0;
                        }
    
                        size = (size + (((4 + JTfy.GUID.Size) | 0))) | 0;
    
                        for (var i1 = 0, c1 = this.PropertyAtomElements.Count; i1 < c1; i1 = (i1 + 1) | 0) {
                            size = (size + (((elementHeaderByteCount + this.PropertyAtomElements.getItem(i1).ByteCount) | 0))) | 0;
                        }
    
                        size = (size + (((4 + JTfy.GUID.Size) | 0))) | 0;
    
                        size = (size + this.PropertyTable.ByteCount) | 0;
    
                        return size;
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        for (var i = 0, c = this.GraphElements.Count; i < c; i = (i + 1) | 0) {
                            var graphElement = this.GraphElements.getItem(i);
                            var objectTypeIdBaseTypePair = JTfy.ConstUtils.TypeToObjectTypeId.getItem(Bridge.getType(graphElement));
    
                            bytesList.AddRange(new JTfy.ElementHeader.ctor(((((graphElement.ByteCount + JTfy.GUID.Size) | 0) + 1) | 0), new JTfy.GUID.$ctor2(objectTypeIdBaseTypePair.Item1), objectTypeIdBaseTypePair.Item2).Bytes);
                            bytesList.AddRange(graphElement.Bytes);
                        }
    
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(JTfy.GUID.Size));
                        bytesList.AddRange(JTfy.ConstUtils.EndOfElement.Bytes);
    
                        for (var i1 = 0, c1 = this.PropertyAtomElements.Count; i1 < c1; i1 = (i1 + 1) | 0) {
                            var propertyAtomElement = this.PropertyAtomElements.getItem(i1);
                            var objectTypeIdBaseTypePair1 = JTfy.ConstUtils.TypeToObjectTypeId.getItem(Bridge.getType(propertyAtomElement));
    
                            bytesList.AddRange(new JTfy.ElementHeader.ctor(((((propertyAtomElement.ByteCount + JTfy.GUID.Size) | 0) + 1) | 0), new JTfy.GUID.$ctor2(objectTypeIdBaseTypePair1.Item1), objectTypeIdBaseTypePair1.Item2).Bytes);
                            bytesList.AddRange(propertyAtomElement.Bytes);
                        }
    
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(JTfy.GUID.Size));
                        bytesList.AddRange(JTfy.ConstUtils.EndOfElement.Bytes);
    
                        bytesList.AddRange(this.PropertyTable.Bytes);
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (graphElements, propertyAtomElements, propertyTable) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.GraphElements = graphElements;
                    this.PropertyAtomElements = propertyAtomElements;
                    this.PropertyTable = propertyTable;
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.GraphElements = new (System.Collections.Generic.List$1(JTfy.BaseDataStructure)).ctor();
    
                    while (true) {
                        var elementHeader = new JTfy.ElementHeader.$ctor1(stream);
    
                        var objectTypeIdAsString = elementHeader.ObjectTypeID.toString();
    
                        if (Bridge.referenceEquals(objectTypeIdAsString, JTfy.ConstUtils.EndOfElementAsString)) {
                            break;
                        }
    
    
                        if (JTfy.ConstUtils.ObjectTypeIdToType.containsKey(objectTypeIdAsString)) {
                            this.GraphElements.add(Bridge.cast(Bridge.Reflection.applyConstructor(JTfy.ConstUtils.ObjectTypeIdToType.getItem(objectTypeIdAsString).Item1, System.Array.init([stream], System.Object)), JTfy.BaseDataStructure));
                        } else {
                            throw new System.NotImplementedException.$ctor1(System.String.format("Case not defined for Graph Element Object Type {0}", [objectTypeIdAsString]));
                        }
                    }
    
                    this.PropertyAtomElements = new (System.Collections.Generic.List$1(JTfy.BasePropertyAtomElement)).ctor();
    
                    while (true) {
                        var elementHeader1 = new JTfy.ElementHeader.$ctor1(stream);
    
                        var objectTypeIdAsString1 = elementHeader1.ObjectTypeID.toString();
    
                        if (Bridge.referenceEquals(objectTypeIdAsString1, JTfy.ConstUtils.EndOfElementAsString)) {
                            break;
                        }
    
    
                        if (JTfy.ConstUtils.ObjectTypeIdToType.containsKey(objectTypeIdAsString1)) {
                            this.PropertyAtomElements.add(Bridge.cast(Bridge.Reflection.applyConstructor(JTfy.ConstUtils.ObjectTypeIdToType.getItem(objectTypeIdAsString1).Item1, System.Array.init([stream], System.Object)), JTfy.BasePropertyAtomElement));
                        } else {
                            throw new System.NotImplementedException.$ctor1(System.String.format("Case not defined for Atom Property Object Type {0}", [objectTypeIdAsString1]));
                        }
                    }
    
                    this.PropertyTable = new JTfy.PropertyTable.$ctor1(stream);
    
    
                    stream.Dispose();
                }
            }
        });
    
        Bridge.define("JTfy.MetaDataSegment", {
            inherits: [JTfy.BaseDataStructure],
            fields: {
                MetaDataElement: null
            },
            props: {
                ByteCount: {
                    get: function () {
                        return ((JTfy.ElementHeader.Size + this.MetaDataElement.ByteCount) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        var objectTypeIdBaseTypePair = JTfy.ConstUtils.TypeToObjectTypeId.getItem(Bridge.getType(this.MetaDataElement));
    
                        bytesList.AddRange(new JTfy.ElementHeader.ctor(((((this.MetaDataElement.ByteCount + JTfy.GUID.Size) | 0) + 1) | 0), new JTfy.GUID.$ctor2(objectTypeIdBaseTypePair.Item1), objectTypeIdBaseTypePair.Item2).Bytes);
                        bytesList.AddRange(this.MetaDataElement.Bytes);
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (metaDataElement) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.MetaDataElement = metaDataElement;
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    var elementHeader = new JTfy.ElementHeader.$ctor1(stream);
    
                    var objectTypeIdAsString = elementHeader.ObjectTypeID.toString();
    
                    if (JTfy.ConstUtils.ObjectTypeIdToType.containsKey(objectTypeIdAsString)) {
                        this.MetaDataElement = Bridge.cast(Bridge.Reflection.applyConstructor(JTfy.ConstUtils.ObjectTypeIdToType.getItem(objectTypeIdAsString).Item1, System.Array.init([stream], System.Object)), JTfy.BaseDataStructure);
                    } else {
                        throw new System.NotImplementedException.$ctor1(System.String.format("Case not defined for Graph Element Object Type {0}", [objectTypeIdAsString]));
                    }
    
    
                    stream.Dispose();
                }
            }
        });
    
        Bridge.define("JTfy.NodePropertyTable", {
            inherits: [JTfy.BaseDataStructure],
            fields: {
                KeyPropertyAtomObjectIDs: null,
                ValuePropertyAtomObjectIDs: null
            },
            props: {
                ByteCount: {
                    get: function () {
                        return Bridge.Int.mul((((Bridge.Int.mul(2, this.KeyPropertyAtomObjectIDs.Count) + 1) | 0)), 4);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        for (var i = 0, c = this.KeyPropertyAtomObjectIDs.Count; i < c; i = (i + 1) | 0) {
                            bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.KeyPropertyAtomObjectIDs.getItem(i)));
                            bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.ValuePropertyAtomObjectIDs.getItem(i)));
                        }
    
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(0));
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (keyPropertyAtomObjectIDs, valuePropertyAtomObjectIDs) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.KeyPropertyAtomObjectIDs = keyPropertyAtomObjectIDs;
                    this.ValuePropertyAtomObjectIDs = valuePropertyAtomObjectIDs;
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.KeyPropertyAtomObjectIDs = new (System.Collections.Generic.List$1(System.Int32)).ctor();
                    this.ValuePropertyAtomObjectIDs = new (System.Collections.Generic.List$1(System.Int32)).ctor();
    
                    var keyPropertyAtomObjectID = JTfy.StreamUtils.ReadInt32(stream);
    
                    while (keyPropertyAtomObjectID !== 0) {
                        this.KeyPropertyAtomObjectIDs.add(keyPropertyAtomObjectID);
                        this.ValuePropertyAtomObjectIDs.add(JTfy.StreamUtils.ReadInt32(stream));
    
                        keyPropertyAtomObjectID = JTfy.StreamUtils.ReadInt32(stream);
                    }
                }
            }
        });
    
        Bridge.define("JTfy.PropertyProxyMetaDataElement", {
            inherits: [JTfy.BaseDataStructure],
            fields: {
                PropertyKeys: null,
                PropertyValueTypes: null,
                PropertyValues: null
            },
            props: {
                ByteCount: {
                    get: function () {
                        var size = 0;
    
                        for (var i = 0, c = this.PropertyKeys.Count; i < c; i = (i + 1) | 0) {
                            size = (size + this.PropertyKeys.getItem(i).ByteCount) | 0;
    
                            size = (size + 1) | 0;
    
                            var propertyValueType = this.PropertyValueTypes.getItem(i);
    
                            switch (propertyValueType) {
                                case 1: 
                                    {
                                        size = (size + Bridge.cast(this.PropertyValues.getItem(i), JTfy.MbString).ByteCount) | 0;
    
                                        break;
                                    }
                                case 2: 
                                    {
                                        size = (size + 4) | 0;
    
                                        break;
                                    }
                                case 3: 
                                    {
                                        size = (size + 4) | 0;
    
                                        break;
                                    }
                                case 4: 
                                    {
                                        size = (size + Bridge.cast(this.PropertyValues.getItem(i), JTfy.Date).ByteCount) | 0;
    
                                        break;
                                    }
                                default: 
                                    {
                                        throw new System.Exception(System.String.format("Property Value Type {0} is not recognised.", [Bridge.box(propertyValueType, System.Byte)]));
                                    }
                            }
                        }
    
                        size = (size + new JTfy.MbString.$ctor2("").ByteCount) | 0;
    
                        return size;
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        for (var i = 0, c = this.PropertyKeys.Count; i < c; i = (i + 1) | 0) {
                            bytesList.AddRange(this.PropertyKeys.getItem(i).Bytes);
    
                            var propertyValueType = this.PropertyValueTypes.getItem(i);
    
                            bytesList.add(propertyValueType);
    
                            switch (propertyValueType) {
                                case 1: 
                                    {
                                        bytesList.AddRange(Bridge.cast(this.PropertyValues.getItem(i), JTfy.MbString).Bytes);
    
                                        break;
                                    }
                                case 2: 
                                    {
                                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(System.Nullable.getValue(Bridge.cast(Bridge.unbox(this.PropertyValues.getItem(i), System.Int32), System.Int32))));
    
                                        break;
                                    }
                                case 3: 
                                    {
                                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$5(System.Nullable.getValue(Bridge.cast(Bridge.unbox(this.PropertyValues.getItem(i), System.Single), System.Single))));
    
                                        break;
                                    }
                                case 4: 
                                    {
                                        bytesList.AddRange(Bridge.cast(this.PropertyValues.getItem(i), JTfy.Date).Bytes);
    
                                        break;
                                    }
                                default: 
                                    {
                                        throw new System.Exception(System.String.format("Property Value Type {0} is not recognised.", [Bridge.box(propertyValueType, System.Byte)]));
                                    }
                            }
                        }
    
                        bytesList.AddRange(new JTfy.MbString.$ctor2("").Bytes);
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (propertyKeys, propertyValues) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    var propertyKeysCount = propertyKeys.Count;
    
                    this.PropertyKeys = new (System.Collections.Generic.List$1(JTfy.MbString)).$ctor2(propertyKeysCount);
    
                    for (var i = 0; i < propertyKeysCount; i = (i + 1) | 0) {
                        this.PropertyKeys.add(new JTfy.MbString.$ctor2(propertyKeys.getItem(i)));
                    }
    
    
    
                    var propertyValuesCount = propertyValues.Count;
    
                    this.PropertyValueTypes = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(propertyValuesCount);
                    this.PropertyValues = new (System.Collections.Generic.List$1(System.Object)).$ctor2(propertyValuesCount);
    
                    for (var i1 = 0; i1 < propertyValuesCount; i1 = (i1 + 1) | 0) {
                        var propertyValue = propertyValues.getItem(i1);
                        var propertyValueTypeName = Bridge.Reflection.getTypeName(Bridge.getType(propertyValue));
    
                        switch (propertyValueTypeName) {
                            case "String": 
                                {
                                    this.PropertyValueTypes.add(1);
                                    this.PropertyValues.add(new JTfy.MbString.$ctor2(Bridge.cast(propertyValue, System.String)));
    
                                    break;
                                }
                            case "Int32": 
                                {
                                    this.PropertyValueTypes.add(2);
                                    this.PropertyValues.add(Bridge.box(System.Nullable.getValue(Bridge.cast(Bridge.unbox(propertyValue, System.Int32), System.Int32)), System.Int32));
    
                                    break;
                                }
                            case "Single": 
                                {
                                    this.PropertyValueTypes.add(3);
                                    this.PropertyValues.add(Bridge.box(System.Nullable.getValue(Bridge.cast(Bridge.unbox(propertyValue, System.Single), System.Single)), System.Single, System.Single.format, System.Single.getHashCode));
    
                                    break;
                                }
                            case "DateTime": 
                                {
                                    this.PropertyValueTypes.add(4);
                                    this.PropertyValues.add(new JTfy.Date.ctor(System.Nullable.getValue(Bridge.cast(Bridge.unbox(propertyValue, System.DateTime), System.DateTime))));
    
                                    break;
                                }
                            default: 
                                {
                                    throw new System.Exception(System.String.format("Property value name {0} is not supported.", [propertyValueTypeName]));
                                }
                        }
                    }
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.PropertyKeys = new (System.Collections.Generic.List$1(JTfy.MbString)).ctor();
                    this.PropertyValueTypes = new (System.Collections.Generic.List$1(System.Byte)).ctor();
                    this.PropertyValues = new (System.Collections.Generic.List$1(System.Object)).ctor();
    
                    var propertyKey = new JTfy.MbString.$ctor1(stream);
    
                    while (propertyKey.Count > 0) {
                        this.PropertyKeys.add(propertyKey);
    
                        var propertyValueType = JTfy.StreamUtils.ReadByte(stream);
    
                        this.PropertyValueTypes.add(propertyValueType);
    
                        switch (propertyValueType) {
                            case 1: 
                                {
                                    this.PropertyValues.add(new JTfy.MbString.$ctor1(stream));
    
                                    break;
                                }
                            case 2: 
                                {
                                    this.PropertyValues.add(Bridge.box(JTfy.StreamUtils.ReadInt32(stream), System.Int32));
    
                                    break;
                                }
                            case 3: 
                                {
                                    this.PropertyValues.add(Bridge.box(JTfy.StreamUtils.ReadFloat(stream), System.Single, System.Single.format, System.Single.getHashCode));
    
                                    break;
                                }
                            case 4: 
                                {
                                    this.PropertyValues.add(new JTfy.Date.$ctor2(stream));
    
                                    break;
                                }
                            default: 
                                {
                                    throw new System.Exception(System.String.format("Property Value Type {0} is not recognised.", [Bridge.box(propertyValueType, System.Byte)]));
                                }
                        }
    
                        propertyKey = new JTfy.MbString.$ctor1(stream);
                    }
                }
            }
        });
    
        Bridge.define("JTfy.QuantizationParameters", {
            inherits: [JTfy.BaseDataStructure],
            fields: {
                BitsPerVertex: 0,
                NormalBitsFactor: 0,
                BitsPerTextureCoord: 0,
                BitsPerColor: 0
            },
            props: {
                ByteCount: {
                    get: function () {
                        return 4;
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = Bridge.fn.bind(this, function (_o1) {
                                _o1.add(this.BitsPerVertex);
                                _o1.add(this.NormalBitsFactor);
                                _o1.add(this.BitsPerTextureCoord);
                                _o1.add(this.BitsPerColor);
                                return _o1;
                            })(new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount));
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (bitsPerVertex, normalBitsFactor, bitsPerTextureCoord, bitsPerColor) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.BitsPerVertex = bitsPerVertex;
                    this.NormalBitsFactor = normalBitsFactor;
                    this.BitsPerTextureCoord = bitsPerTextureCoord;
                    this.BitsPerColor = bitsPerColor;
                },
                $ctor1: function (stream) {
                    JTfy.QuantizationParameters.ctor.call(this, JTfy.StreamUtils.ReadByte(stream), JTfy.StreamUtils.ReadByte(stream), JTfy.StreamUtils.ReadByte(stream), JTfy.StreamUtils.ReadByte(stream));
                }
            }
        });
    
        Bridge.define("JTfy.SegmentHeader", {
            inherits: [JTfy.BaseDataStructure],
            statics: {
                props: {
                    Size: {
                        get: function () {
                            return ((((JTfy.GUID.Size + 4) | 0) + 4) | 0);
                        }
                    }
                }
            },
            fields: {
                SegmentID: null,
                SegmentType: 0,
                SegmentLength: 0
            },
            props: {
                ByteCount: {
                    get: function () {
                        return JTfy.SegmentHeader.Size;
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(this.SegmentID.Bytes);
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.SegmentType));
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.SegmentLength));
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (segmentID, segmentType, segmentLength) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.SegmentID = segmentID;
                    this.SegmentType = segmentType;
                    this.SegmentLength = segmentLength;
                },
                $ctor1: function (stream) {
                    JTfy.SegmentHeader.ctor.call(this, new JTfy.GUID.$ctor1(stream), JTfy.StreamUtils.ReadInt32(stream), JTfy.StreamUtils.ReadInt32(stream));
                }
            },
            methods: {
                toString: function () {
                    return System.String.format("{0}|{1}|{2}", this.SegmentID, Bridge.box(this.SegmentType, System.Int32), Bridge.box(this.SegmentLength, System.Int32));
                }
            }
        });
    
        Bridge.define("JTfy.ShapeLODSegment", {
            inherits: [JTfy.BaseDataStructure],
            fields: {
                ShapeLODElement: null
            },
            props: {
                ByteCount: {
                    get: function () {
                        return ((JTfy.ElementHeader.Size + this.ShapeLODElement.ByteCount) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        var objectTypeIdBaseTypePair = JTfy.ConstUtils.TypeToObjectTypeId.getItem(Bridge.getType(this.ShapeLODElement));
    
                        bytesList.AddRange(new JTfy.ElementHeader.ctor(((((this.ShapeLODElement.ByteCount + JTfy.GUID.Size) | 0) + 1) | 0), new JTfy.GUID.$ctor2(objectTypeIdBaseTypePair.Item1), objectTypeIdBaseTypePair.Item2).Bytes);
                        bytesList.AddRange(this.ShapeLODElement.Bytes);
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (shapeLODElement) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.ShapeLODElement = shapeLODElement;
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    var elementHeader = new JTfy.ElementHeader.$ctor1(stream);
    
                    var objectTypeIdAsString = elementHeader.ObjectTypeID.toString();
    
                    if (JTfy.ConstUtils.ObjectTypeIdToType.containsKey(objectTypeIdAsString)) {
                        this.ShapeLODElement = Bridge.cast(Bridge.Reflection.applyConstructor(JTfy.ConstUtils.ObjectTypeIdToType.getItem(objectTypeIdAsString).Item1, System.Array.init([stream], System.Object)), JTfy.BaseDataStructure);
                    } else {
                        throw new System.NotImplementedException.$ctor1(System.String.format("Case not defined for Shape LOD Element Object Type {0}", [objectTypeIdAsString]));
                    }
    
    
                    stream.Dispose();
                }
            }
        });
    
        Bridge.define("JTfy.TOCEntry", {
            inherits: [JTfy.BaseDataStructure],
            statics: {
                props: {
                    Size: {
                        get: function () {
                            return ((((((JTfy.GUID.Size + 4) | 0) + 4) | 0) + 4) | 0);
                        }
                    }
                }
            },
            fields: {
                SegmentID: null,
                SegmentOffset: 0,
                SegmentLength: 0,
                SegmentAttributes: 0
            },
            props: {
                ByteCount: {
                    get: function () {
                        return JTfy.TOCEntry.Size;
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(this.SegmentID.Bytes);
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.SegmentOffset));
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.SegmentLength));
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$7(this.SegmentAttributes));
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (segmentID, segmentOffset, segmentLength, segmentAttributes) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.SegmentID = segmentID;
                    this.SegmentOffset = segmentOffset;
                    this.SegmentLength = segmentLength;
                    this.SegmentAttributes = segmentAttributes;
                },
                $ctor1: function (stream) {
                    JTfy.TOCEntry.ctor.call(this, new JTfy.GUID.$ctor1(stream), JTfy.StreamUtils.ReadInt32(stream), JTfy.StreamUtils.ReadInt32(stream), JTfy.StreamUtils.ReadUInt32(stream));
                }
            }
        });
    
        Bridge.define("JTfy.TOCSegment", {
            inherits: [JTfy.BaseDataStructure],
            fields: {
                EntryCount: 0,
                TOCEntries: null
            },
            props: {
                ByteCount: {
                    get: function () {
                        return ((4 + Bridge.Int.mul(this.EntryCount, JTfy.TOCEntry.Size)) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var $t;
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.EntryCount));
    
                        for (var i = 0; i < this.EntryCount; i = (i + 1) | 0) {
                            bytesList.AddRange(($t = this.TOCEntries)[System.Array.index(i, $t)].Bytes);
                        }
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (tocEntries) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.EntryCount = tocEntries.length;
                    this.TOCEntries = tocEntries;
                },
                $ctor1: function (stream) {
                    var $t;
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.EntryCount = JTfy.StreamUtils.ReadInt32(stream);
    
                    this.TOCEntries = System.Array.init(this.EntryCount, null, JTfy.TOCEntry);
    
                    for (var i = 0; i < this.EntryCount; i = (i + 1) | 0) {
                        ($t = this.TOCEntries)[System.Array.index(i, $t)] = new JTfy.TOCEntry.$ctor1(stream);
                    }
                }
            }
        });
    
        Bridge.define("JTfy.VertexShapeLODElement", {
            inherits: [JTfy.BaseDataStructure],
            fields: {
                versionNumber: 0,
                BindingAttributes: 0,
                QuantizationParameters: null
            },
            props: {
                ByteCount: {
                    get: function () {
                        return ((6 + this.QuantizationParameters.ByteCount) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$2(this.versionNumber));
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.BindingAttributes));
                        bytesList.AddRange(this.QuantizationParameters.Bytes);
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                init: function () {
                    this.versionNumber = 1;
                },
                ctor: function (bindingAttributes, quantizationParameters) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.BindingAttributes = bindingAttributes;
                    this.QuantizationParameters = quantizationParameters;
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.versionNumber = JTfy.StreamUtils.ReadInt16(stream);
    
                    this.BindingAttributes = JTfy.StreamUtils.ReadInt32(stream);
                    this.QuantizationParameters = new JTfy.QuantizationParameters.$ctor1(stream);
                }
            }
        });
    
        Bridge.define("JTfy.VertexBasedShapeCompressedRepData", {
            inherits: [JTfy.BaseDataStructure],
            fields: {
                VersionNumber: 0,
                NormalBinding: 0,
                TextureCoordBinding: 0,
                ColourBinding: 0,
                QuantizationParameters: null,
                LosslessCompressedRawVertexData: null,
                Positions: null,
                Normals: null,
                TriStrips: null,
                primitiveListIndicesInt32CompressedDataPacketBytes: null
            },
            props: {
                PrimitiveListIndices: {
                    get: function () {
                        var $t;
                        var triStripsCount = this.TriStrips.length;
    
                        var primitiveListIndices = new (System.Collections.Generic.List$1(System.Int32)).$ctor2(((triStripsCount + 1) | 0));
    
                        for (var i = 0; i < triStripsCount; i = (i + 1) | 0) {
                            var triStrip = ($t = this.TriStrips)[System.Array.index(i, $t)];
    
                            primitiveListIndices.add(triStrip[System.Array.index(0, triStrip)]);
    
                            if (((i + 1) | 0) === triStripsCount) {
                                primitiveListIndices.add(((triStrip[System.Array.index(((triStrip.length - 1) | 0), triStrip)] + 1) | 0));
                            }
                        }
    
                        return primitiveListIndices;
                    }
                },
                PrimitiveListIndicesInt32CompressedDataPacketBytes: {
                    get: function () {
                        if (this.primitiveListIndicesInt32CompressedDataPacketBytes == null) {
                            this.primitiveListIndicesInt32CompressedDataPacketBytes = JTfy.Int32CompressedDataPacket.Encode(this.PrimitiveListIndices.ToArray(), JTfy.Int32CompressedDataPacket.PredictorType.Stride1);
                        }
    
                        return this.primitiveListIndicesInt32CompressedDataPacketBytes;
                    }
                },
                ByteCount: {
                    get: function () {
                        return ((((((5 + this.QuantizationParameters.ByteCount) | 0) + this.PrimitiveListIndicesInt32CompressedDataPacketBytes.length) | 0) + this.LosslessCompressedRawVertexData.ByteCount) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$2(this.VersionNumber));
                        bytesList.add(this.NormalBinding);
                        bytesList.add(this.TextureCoordBinding);
                        bytesList.add(this.ColourBinding);
                        bytesList.AddRange(this.QuantizationParameters.Bytes);
                        bytesList.AddRange(this.PrimitiveListIndicesInt32CompressedDataPacketBytes);
                        bytesList.AddRange(this.LosslessCompressedRawVertexData.Bytes);
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (triStrips, vertexPositions, vertexNormals) {
                    if (vertexNormals === void 0) { vertexNormals = null; }
                    var $t, $t1;
    
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.VersionNumber = 1;
                    this.NormalBinding = (vertexNormals == null ? 0 : 1) & 255;
                    this.TextureCoordBinding = 0;
                    this.ColourBinding = 0;
                    this.QuantizationParameters = new JTfy.QuantizationParameters.ctor(0, 0, 0, 0);
    
    
    
    
                    var newVertexIndex = 0;
    
                    var newTriStrips = System.Array.init(triStrips.length, null, System.Array.type(System.Int32));
                    var newVertexPositions = new (System.Collections.Generic.List$1(System.Array.type(System.Single))).$ctor2(vertexPositions.length);
                    var newVertexNormals = vertexNormals == null ? null : new (System.Collections.Generic.List$1(System.Array.type(System.Single))).$ctor2(vertexNormals.length);
    
                    for (var triStripIndex = 0, triStripCount = triStrips.length; triStripIndex < triStripCount; triStripIndex = (triStripIndex + 1) | 0) {
                        var triStrip = triStrips[System.Array.index(triStripIndex, triStrips)];
                        var indicesCount = triStrip.length;
    
                        var newTriStrip = System.Array.init(indicesCount, 0, System.Int32);
    
                        for (var i = 0; i < indicesCount; i = (i + 1) | 0) {
                            newTriStrip[System.Array.index(i, newTriStrip)] = Bridge.identity(newVertexIndex, ((newVertexIndex = (newVertexIndex + 1) | 0)));
    
                            var vertexIndex = triStrip[System.Array.index(i, triStrip)];
    
                            newVertexPositions.add(vertexPositions[System.Array.index(vertexIndex, vertexPositions)]);
                            if (vertexNormals != null) {
                                newVertexNormals.add(vertexNormals[System.Array.index(vertexIndex, vertexNormals)]);
                            }
                        }
    
                        newTriStrips[System.Array.index(triStripIndex, newTriStrips)] = newTriStrip;
                    }
    
                    this.TriStrips = newTriStrips;
    
                    this.TriStrips = newTriStrips;
                    this.Positions = newVertexPositions.ToArray();
                    this.Normals = vertexNormals != null ? newVertexNormals.ToArray() : null;
    
    
                    var vertexData = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(Bridge.Int.mul((Bridge.Int.mul(12, newVertexPositions.Count)), (vertexNormals == null ? 1 : 2)));
    
                    for (var i1 = 0, c = newVertexPositions.Count; i1 < c; i1 = (i1 + 1) | 0) {
                        if (vertexNormals != null) {
                            var vertexNormal = ($t = this.Normals)[System.Array.index(i1, $t)];
    
                            vertexData.AddRange(JTfy.StreamUtils.ToBytes$5(vertexNormal[System.Array.index(0, vertexNormal)]));
                            vertexData.AddRange(JTfy.StreamUtils.ToBytes$5(vertexNormal[System.Array.index(1, vertexNormal)]));
                            vertexData.AddRange(JTfy.StreamUtils.ToBytes$5(vertexNormal[System.Array.index(2, vertexNormal)]));
                        }
    
                        var vertexPosition = ($t1 = this.Positions)[System.Array.index(i1, $t1)];
    
                        vertexData.AddRange(JTfy.StreamUtils.ToBytes$5(vertexPosition[System.Array.index(0, vertexPosition)]));
                        vertexData.AddRange(JTfy.StreamUtils.ToBytes$5(vertexPosition[System.Array.index(1, vertexPosition)]));
                        vertexData.AddRange(JTfy.StreamUtils.ToBytes$5(vertexPosition[System.Array.index(2, vertexPosition)]));
                    }
    
                    this.LosslessCompressedRawVertexData = new JTfy.LosslessCompressedRawVertexData.ctor(vertexData.ToArray());
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BaseDataStructure.ctor.call(this);
                    this.VersionNumber = JTfy.StreamUtils.ReadInt16(stream);
                    this.NormalBinding = JTfy.StreamUtils.ReadByte(stream);
                    this.TextureCoordBinding = JTfy.StreamUtils.ReadByte(stream);
                    this.ColourBinding = JTfy.StreamUtils.ReadByte(stream);
                    this.QuantizationParameters = new JTfy.QuantizationParameters.$ctor1(stream);
    
                    var primitiveListIndices = JTfy.Int32CompressedDataPacket.GetArrayI32(stream, JTfy.Int32CompressedDataPacket.PredictorType.Stride1);
    
                    var vertexDataStream;
                    if (this.QuantizationParameters.BitsPerVertex === 0) {
                        this.LosslessCompressedRawVertexData = new JTfy.LosslessCompressedRawVertexData.$ctor1(stream);
    
                        vertexDataStream = new System.IO.MemoryStream.$ctor1(this.LosslessCompressedRawVertexData.VertexData);
                    } else {
                        throw new System.NotImplementedException.$ctor1("LossyQuantizedRawVertexData NOT IMPLEMENTED");
                    }
    
                    var readNormals = this.NormalBinding === 1;
                    var readTextureCoords = this.TextureCoordBinding === 1;
                    var readColours = this.ColourBinding === 1;
    
                    var vertexEntrySize = (((((3 + (readNormals ? 3 : 0)) | 0) + (readTextureCoords ? 2 : 0)) | 0) + (readColours ? 3 : 0)) | 0;
                    var vertexEntryCount = (vertexDataStream.Length.div(System.Int64(4))).div(System.Int64(vertexEntrySize));
    
                    var vertexPositions = System.Array.init(vertexEntryCount, null, System.Array.type(System.Single));
                    var vertexNormals = readNormals ? System.Array.init(vertexEntryCount, null, System.Array.type(System.Single)) : null;
                    var vertexColours = readColours ? System.Array.init(vertexEntryCount, null, System.Array.type(System.Single)) : null;
                    var vertexTextureCoordinates = readTextureCoords ? System.Array.init(vertexEntryCount, null, System.Array.type(System.Single)) : null;
    
                    for (var i = 0; System.Int64(i).lt(vertexEntryCount); i = (i + 1) | 0) {
                        if (readTextureCoords) {
                            vertexTextureCoordinates[System.Array.index(i, vertexTextureCoordinates)] = System.Array.init([JTfy.StreamUtils.ReadFloat(vertexDataStream), JTfy.StreamUtils.ReadFloat(vertexDataStream)], System.Single);
                        }
    
                        if (readColours) {
                            vertexColours[System.Array.index(i, vertexColours)] = System.Array.init([JTfy.StreamUtils.ReadFloat(vertexDataStream), JTfy.StreamUtils.ReadFloat(vertexDataStream), JTfy.StreamUtils.ReadFloat(vertexDataStream)], System.Single);
                        }
    
                        if (readNormals) {
                            vertexNormals[System.Array.index(i, vertexNormals)] = System.Array.init([JTfy.StreamUtils.ReadFloat(vertexDataStream), JTfy.StreamUtils.ReadFloat(vertexDataStream), JTfy.StreamUtils.ReadFloat(vertexDataStream)], System.Single);
                        }
    
                        vertexPositions[System.Array.index(i, vertexPositions)] = System.Array.init([JTfy.StreamUtils.ReadFloat(vertexDataStream), JTfy.StreamUtils.ReadFloat(vertexDataStream), JTfy.StreamUtils.ReadFloat(vertexDataStream)], System.Single);
                    }
    
                    this.Positions = vertexPositions;
                    this.Normals = vertexNormals;
    
                    var triStripCount = (primitiveListIndices.length - 1) | 0;
                    var triStrips = System.Array.init(triStripCount, null, System.Array.type(System.Int32));
    
                    for (var triStripIndex = 0; triStripIndex < triStripCount; triStripIndex = (triStripIndex + 1) | 0) {
                        var startIndex = primitiveListIndices[System.Array.index(triStripIndex, primitiveListIndices)];
                        var endIndex = primitiveListIndices[System.Array.index(((triStripIndex + 1) | 0), primitiveListIndices)];
    
                        var indicesCount = (endIndex - startIndex) | 0;
                        var indices = System.Array.init(indicesCount, 0, System.Int32);
    
                        for (var i1 = 0; i1 < indicesCount; i1 = (i1 + 1) | 0) {
                            indices[System.Array.index(i1, indices)] = (startIndex + i1) | 0;
                        }
    
                        triStrips[System.Array.index(triStripIndex, triStrips)] = indices;
                    }
    
                    this.TriStrips = triStrips;
                }
            }
        });
    
        Bridge.define("JTfy.BaseShapeNodeElement", {
            inherits: [JTfy.BaseNodeElement],
            fields: {
                transformedBBox: null,
                UntransformedBBox: null,
                Area: 0,
                VertexCountRange: null,
                nodeCountRange: null,
                polygonCountRange: null,
                Size: 0,
                CompressionLevel: 0
            },
            props: {
                TransformedBBox: {
                    get: function () {
                        return this.transformedBBox;
                    },
                    set: function (value) {
                        this.transformedBBox = value || new JTfy.BBoxF32.ctor();
                    }
                },
                NodeCountRange: {
                    get: function () {
                        return this.nodeCountRange;
                    },
                    set: function (value) {
                        this.nodeCountRange = value;
                    }
                },
                PolygonCountRange: {
                    get: function () {
                        return this.polygonCountRange;
                    },
                    set: function (value) {
                        this.polygonCountRange = value;
                    }
                },
                ByteCount: {
                    get: function () {
                        return ((((((((((((((((Bridge.ensureBaseProperty(this, "ByteCount").$JTfy$BaseNodeElement$ByteCount + this.TransformedBBox.ByteCount) | 0) + this.UntransformedBBox.ByteCount) | 0) + 4) | 0) + this.VertexCountRange.ByteCount) | 0) + this.NodeCountRange.ByteCount) | 0) + this.PolygonCountRange.ByteCount) | 0) + 4) | 0) + 4) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(Bridge.ensureBaseProperty(this, "Bytes").$JTfy$BaseNodeElement$Bytes);
    
                        bytesList.AddRange(this.TransformedBBox.Bytes);
                        bytesList.AddRange(this.UntransformedBBox.Bytes);
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$5(this.Area));
                        bytesList.AddRange(this.VertexCountRange.Bytes);
                        bytesList.AddRange(this.NodeCountRange.Bytes);
                        bytesList.AddRange(this.PolygonCountRange.Bytes);
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.Size));
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$5(this.CompressionLevel));
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                init: function () {
                    this.transformedBBox = new JTfy.BBoxF32.ctor();
                    this.nodeCountRange = new JTfy.CountRange.ctor();
                    this.polygonCountRange = new JTfy.CountRange.ctor();
                },
                $ctor1: function (geometricSet, objectId) {
                    this.$initialize();
                    JTfy.BaseNodeElement.ctor.call(this, objectId);
                    this.TransformedBBox = new JTfy.BBoxF32.ctor();
                    this.UntransformedBBox = geometricSet.UntransformedBoundingBox;
                    this.Area = geometricSet.Area;
                    this.VertexCountRange = new JTfy.CountRange.$ctor1(geometricSet.Positions.length);
                    this.NodeCountRange = new JTfy.CountRange.$ctor1(1);
                    this.PolygonCountRange = new JTfy.CountRange.$ctor1(geometricSet.TriangleCount);
                    this.Size = geometricSet.Size;
                    this.CompressionLevel = 0;
                },
                ctor: function (untransformedBBox, vertexCountRange, objectId) {
                    this.$initialize();
                    JTfy.BaseNodeElement.ctor.call(this, objectId);
                    this.UntransformedBBox = untransformedBBox;
                    this.VertexCountRange = vertexCountRange;
                    this.CompressionLevel = 0;
                },
                $ctor2: function (stream) {
                    this.$initialize();
                    JTfy.BaseNodeElement.$ctor1.call(this, stream);
                    this.TransformedBBox = new JTfy.BBoxF32.$ctor2(stream);
                    this.UntransformedBBox = new JTfy.BBoxF32.$ctor2(stream);
                    this.Area = JTfy.StreamUtils.ReadFloat(stream);
                    this.VertexCountRange = new JTfy.CountRange.$ctor3(stream);
                    this.NodeCountRange = new JTfy.CountRange.$ctor3(stream);
                    this.PolygonCountRange = new JTfy.CountRange.$ctor3(stream);
                    this.Size = JTfy.StreamUtils.ReadInt32(stream);
                    this.CompressionLevel = JTfy.StreamUtils.ReadFloat(stream);
                }
            }
        });
    
        Bridge.define("JTfy.Coord$1", function (T) { return {
            inherits: [JTfy.DataArray$1(T)],
            ctors: {
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.DataArray$1(T).ctor.call(this);
                    this.data = System.Array.init(3, function (){
                        return Bridge.getDefaultValue(T);
                    }, T);
    
                    for (var i = 0, c = this.data.length; i < c; i = (i + 1) | 0) {
                        this.data[System.Array.index(i, this.data)] = JTfy.StreamUtils.Read(T, stream);
                    }
                },
                ctor: function (x, y, z) {
                    this.$initialize();
                    JTfy.DataArray$1(T).ctor.call(this);
                    this.data = System.Array.init([x, y, z], T);
                }
            }
        }; });
    
        Bridge.define("JTfy.CountRange", {
            inherits: [JTfy.DataArray$1(System.Int32)],
            props: {
                Min: {
                    get: function () {
                        return this.data[System.Array.index(0, this.data)];
                    }
                },
                Max: {
                    get: function () {
                        return this.data[System.Array.index(1, this.data)];
                    }
                }
            },
            ctors: {
                $ctor3: function (stream) {
                    this.$initialize();
                    JTfy.DataArray$1(System.Int32).ctor.call(this);
                    this.data = System.Array.init([JTfy.StreamUtils.ReadInt32(stream), JTfy.StreamUtils.ReadInt32(stream)], System.Int32);
                },
                $ctor2: function (minCount, maxCount) {
                    this.$initialize();
                    JTfy.DataArray$1(System.Int32).ctor.call(this);
                    this.data = System.Array.init([minCount, maxCount], System.Int32);
                },
                ctor: function () {
                    JTfy.CountRange.$ctor2.call(this, 0, 0);
                },
                $ctor1: function (count) {
                    JTfy.CountRange.$ctor2.call(this, count, count);
                }
            }
        });
    
        Bridge.define("JTfy.Date", {
            inherits: [JTfy.DataArray$1(System.Int16)],
            props: {
                Year: {
                    get: function () {
                        return this.data[System.Array.index(0, this.data)];
                    }
                },
                Month: {
                    get: function () {
                        return this.data[System.Array.index(1, this.data)];
                    }
                },
                Day: {
                    get: function () {
                        return this.data[System.Array.index(2, this.data)];
                    }
                },
                Hour: {
                    get: function () {
                        return this.data[System.Array.index(3, this.data)];
                    }
                },
                Minute: {
                    get: function () {
                        return this.data[System.Array.index(4, this.data)];
                    }
                },
                Second: {
                    get: function () {
                        return this.data[System.Array.index(5, this.data)];
                    }
                }
            },
            ctors: {
                $ctor2: function (stream) {
                    this.$initialize();
                    JTfy.DataArray$1(System.Int16).ctor.call(this);
                    this.data = System.Array.init(6, 0, System.Int16);
    
                    for (var i = 0, c = this.data.length; i < c; i = (i + 1) | 0) {
                        this.data[System.Array.index(i, this.data)] = JTfy.StreamUtils.ReadInt16(stream);
                    }
                },
                $ctor1: function (year, month, day, hour, minute, second) {
                    this.$initialize();
                    JTfy.DataArray$1(System.Int16).ctor.call(this);
                    this.data = System.Array.init([year, month, day, hour, minute, second], System.Int16);
                },
                ctor: function (date) {
                    JTfy.Date.$ctor1.call(this, Bridge.Int.sxs((System.DateTime.getYear(date)) & 65535), Bridge.Int.sxs((((System.DateTime.getMonth(date) - 1) | 0)) & 65535), Bridge.Int.sxs((System.DateTime.getDay(date)) & 65535), Bridge.Int.sxs((System.DateTime.getHour(date)) & 65535), Bridge.Int.sxs((System.DateTime.getMinute(date)) & 65535), Bridge.Int.sxs((System.DateTime.getSecond(date)) & 65535));
                }
            },
            methods: {
                toString: function () {
                    return System.DateTime.format(System.DateTime.create(this.Year, ((this.Month + 1) | 0), this.Day, this.Hour, this.Minute, this.Second));
                }
            }
        });
    
        Bridge.define("JTfy.DatePropertyAtomElement", {
            inherits: [JTfy.BasePropertyAtomElement],
            fields: {
                Date: null
            },
            props: {
                ByteCount: {
                    get: function () {
                        return ((Bridge.ensureBaseProperty(this, "ByteCount").$JTfy$BasePropertyAtomElement$ByteCount + this.Date.ByteCount) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(Bridge.ensureBaseProperty(this, "Bytes").$JTfy$BasePropertyAtomElement$Bytes);
    
                        bytesList.AddRange(this.Date.Bytes);
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                $ctor1: function (dateTime, objectId) {
                    JTfy.DatePropertyAtomElement.ctor.call(this, new JTfy.Date.ctor(dateTime), objectId);
                },
                ctor: function (date, objectId) {
                    this.$initialize();
                    JTfy.BasePropertyAtomElement.ctor.call(this, objectId);
                    this.Date = date;
                },
                $ctor2: function (stream) {
                    this.$initialize();
                    JTfy.BasePropertyAtomElement.$ctor1.call(this, stream);
                    this.Date = new JTfy.Date.$ctor2(stream);
                }
            },
            methods: {
                toString: function () {
                    return this.Date.toString();
                }
            }
        });
    
        Bridge.define("JTfy.FloatingPointPropertyAtomElement", {
            inherits: [JTfy.BasePropertyAtomElement],
            fields: {
                Value: 0
            },
            props: {
                ByteCount: {
                    get: function () {
                        return ((Bridge.ensureBaseProperty(this, "ByteCount").$JTfy$BasePropertyAtomElement$ByteCount + 4) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(Bridge.ensureBaseProperty(this, "Bytes").$JTfy$BasePropertyAtomElement$Bytes);
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$5(this.Value));
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                $ctor1: function (value, objectId) {
                    this.$initialize();
                    JTfy.BasePropertyAtomElement.ctor.call(this, objectId);
                    this.Value = value;
                },
                ctor: function (stream) {
                    this.$initialize();
                    JTfy.BasePropertyAtomElement.$ctor1.call(this, stream);
                    this.Value = JTfy.StreamUtils.ReadFloat(stream);
                }
            },
            methods: {
                toString: function () {
                    return System.Single.format(this.Value);
                }
            }
        });
    
        Bridge.define("JTfy.GeometricTransformAttributeElement", {
            inherits: [JTfy.BaseAttributeElement],
            fields: {
                StoredValuesMask: 0,
                ElementValues: null,
                TransformationMatrix: null
            },
            props: {
                ByteCount: {
                    get: function () {
                        return ((((Bridge.ensureBaseProperty(this, "ByteCount").$JTfy$BaseAttributeElement$ByteCount + 2) | 0) + Bridge.Int.mul(this.ElementValues.length, 4)) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var $t;
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(Bridge.ensureBaseProperty(this, "Bytes").$JTfy$BaseAttributeElement$Bytes);
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$6(this.StoredValuesMask));
    
                        for (var i = 0, c = this.ElementValues.length; i < c; i = (i + 1) | 0) {
                            bytesList.AddRange(JTfy.StreamUtils.ToBytes$5(($t = this.ElementValues)[System.Array.index(i, $t)]));
                        }
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                init: function () {
                    this.TransformationMatrix = JTfy.ConstUtils.IndentityMatrix;
                },
                $ctor1: function (transformationMatrix, objectId) {
                    var $t;
                    this.$initialize();
                    JTfy.BaseAttributeElement.ctor.call(this, objectId);
                    if (transformationMatrix == null) {
                        transformationMatrix = JTfy.ConstUtils.IndentityMatrix;
                    }
    
                    var transformationMatrixLength = transformationMatrix.length;
    
                    if (transformationMatrixLength < 16 || transformationMatrixLength > 16) {
                        throw new System.Exception(System.String.format("transformationMatrix has to be 16 floats long, currently it is {0} floats long", [Bridge.box(transformationMatrixLength, System.Int32)]));
                    }
    
                    var elementValueList = new (System.Collections.Generic.List$1(System.Single)).$ctor2(16);
    
                    this.StoredValuesMask = 0;
    
                    var mask = 32768;
    
                    for (var i = 0; i < transformationMatrixLength; i = (i + 1) | 0) {
                        var value = transformationMatrix[System.Array.index(i, transformationMatrix)];
    
                        if (value !== ($t = JTfy.ConstUtils.IndentityMatrix)[System.Array.index(i, $t)]) {
                            elementValueList.add(value);
                            this.StoredValuesMask = (this.StoredValuesMask | mask) & 65535;
                        }
    
                        mask = (mask >> 1) & 65535;
                    }
    
                    this.ElementValues = elementValueList.ToArray();
    
                    this.TransformationMatrix = transformationMatrix;
                },
                ctor: function (stream) {
                    this.$initialize();
                    JTfy.BaseAttributeElement.$ctor1.call(this, stream);
                    this.StoredValuesMask = JTfy.StreamUtils.ReadUInt16(stream);
    
                    var elementValueList = new (System.Collections.Generic.List$1(System.Single)).$ctor2(16);
    
                    var storedValuesMask = this.StoredValuesMask;
    
                    for (var i = 0, c = 16; i < c; i = (i + 1) | 0) {
                        if ((storedValuesMask & 32768) > 0) {
                            var value = JTfy.StreamUtils.ReadFloat(stream);
    
                            elementValueList.add(value);
    
                            this.TransformationMatrix[System.Array.index(i, this.TransformationMatrix)] = value;
                        }
    
                        storedValuesMask = (storedValuesMask << 1) & 65535;
                    }
    
                    this.ElementValues = elementValueList.ToArray();
                }
            }
        });
    
        Bridge.define("JTfy.GroupNodeElement", {
            inherits: [JTfy.BaseNodeElement],
            fields: {
                childNodeObjectIds: null
            },
            props: {
                ChildCount: {
                    get: function () {
                        return this.ChildNodeObjectIds.Count;
                    }
                },
                ChildNodeObjectIds: {
                    get: function () {
                        return this.childNodeObjectIds;
                    },
                    set: function (value) {
                        this.childNodeObjectIds = value || new (System.Collections.Generic.List$1(System.Int32)).ctor();
                    }
                },
                ByteCount: {
                    get: function () {
                        return ((((Bridge.ensureBaseProperty(this, "ByteCount").$JTfy$BaseNodeElement$ByteCount + 4) | 0) + Bridge.Int.mul(this.ChildCount, 4)) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(Bridge.ensureBaseProperty(this, "Bytes").$JTfy$BaseNodeElement$Bytes);
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.ChildCount));
    
                        for (var i = 0; i < this.ChildCount; i = (i + 1) | 0) {
                            bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.ChildNodeObjectIds.getItem(i)));
                        }
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                init: function () {
                    this.childNodeObjectIds = new (System.Collections.Generic.List$1(System.Int32)).ctor();
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BaseNodeElement.$ctor1.call(this, stream);
                    var childCount = JTfy.StreamUtils.ReadInt32(stream);
                    this.ChildNodeObjectIds = new (System.Collections.Generic.List$1(System.Int32)).$ctor2(childCount);
    
                    for (var i = 0; i < childCount; i = (i + 1) | 0) {
                        this.ChildNodeObjectIds.add(JTfy.StreamUtils.ReadInt32(stream));
                    }
                },
                ctor: function (objectId) {
                    this.$initialize();
                    JTfy.BaseNodeElement.ctor.call(this, objectId);
                }
            }
        });
    
        Bridge.define("JTfy.InstanceNodeElement", {
            inherits: [JTfy.BaseNodeElement],
            fields: {
                ChildNodeObjectID: 0
            },
            props: {
                ByteCount: {
                    get: function () {
                        return ((Bridge.ensureBaseProperty(this, "ByteCount").$JTfy$BaseNodeElement$ByteCount + 4) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(Bridge.ensureBaseProperty(this, "Bytes").$JTfy$BaseNodeElement$Bytes);
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.ChildNodeObjectID));
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (childNodeObjectID, objectId) {
                    this.$initialize();
                    JTfy.BaseNodeElement.ctor.call(this, objectId);
                    this.ChildNodeObjectID = childNodeObjectID;
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BaseNodeElement.$ctor1.call(this, stream);
                    this.ChildNodeObjectID = JTfy.StreamUtils.ReadInt32(stream);
                }
            }
        });
    
        Bridge.define("JTfy.IntegerPropertyAtomElement", {
            inherits: [JTfy.BasePropertyAtomElement],
            fields: {
                Value: 0
            },
            props: {
                ByteCount: {
                    get: function () {
                        return ((Bridge.ensureBaseProperty(this, "ByteCount").$JTfy$BasePropertyAtomElement$ByteCount + 4) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(Bridge.ensureBaseProperty(this, "Bytes").$JTfy$BasePropertyAtomElement$Bytes);
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.Value));
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (value, objectId) {
                    this.$initialize();
                    JTfy.BasePropertyAtomElement.ctor.call(this, objectId);
                    this.Value = value;
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BasePropertyAtomElement.$ctor1.call(this, stream);
                    this.Value = JTfy.StreamUtils.ReadInt32(stream);
                }
            },
            methods: {
                toString: function () {
                    return Bridge.toString(this.Value);
                }
            }
        });
    
        Bridge.define("JTfy.LateLoadedPropertyAtomElement", {
            inherits: [JTfy.BasePropertyAtomElement],
            fields: {
                SegmentId: null,
                SegmentType: 0
            },
            props: {
                ByteCount: {
                    get: function () {
                        return ((((Bridge.ensureBaseProperty(this, "ByteCount").$JTfy$BasePropertyAtomElement$ByteCount + JTfy.GUID.Size) | 0) + 4) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesArray = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesArray.AddRange(Bridge.ensureBaseProperty(this, "Bytes").$JTfy$BasePropertyAtomElement$Bytes);
                        bytesArray.AddRange(this.SegmentId.Bytes);
                        bytesArray.AddRange(JTfy.StreamUtils.ToBytes$3(this.SegmentType));
    
                        return bytesArray.ToArray();
                    }
                }
            },
            ctors: {
                ctor: function (segmentId, segmentType, objectId) {
                    this.$initialize();
                    JTfy.BasePropertyAtomElement.ctor.call(this, objectId);
                    this.SegmentId = segmentId;
                    this.SegmentType = segmentType;
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BasePropertyAtomElement.$ctor1.call(this, stream);
                    this.SegmentId = new JTfy.GUID.$ctor1(stream);
                    this.SegmentType = JTfy.StreamUtils.ReadInt32(stream);
                }
            }
        });
    
        Bridge.define("JTfy.MaterialAttributeElement", {
            inherits: [JTfy.BaseAttributeElement],
            fields: {
                DataFlags: 0,
                AmbientCommonRGBValue: 0,
                AmbientColour: null,
                DiffuseColour: null,
                SpecularCommonRGBValue: 0,
                SpecularColour: null,
                EmissionCommonRGBValue: 0,
                EmissionColour: null,
                shininess: 0
            },
            props: {
                Shininess: {
                    get: function () {
                        return this.shininess;
                    },
                    set: function (value) {
                        this.shininess = value < 0 ? 0 : (value > 128 ? 128 : value);
                    }
                },
                ByteCount: {
                    get: function () {
                        return ((((((((((((Bridge.ensureBaseProperty(this, "ByteCount").$JTfy$BaseAttributeElement$ByteCount + 2) | 0) + (this.AmbientColour == null ? 4 : this.AmbientColour.ByteCount)) | 0) + this.DiffuseColour.ByteCount) | 0) + (this.SpecularColour == null ? 4 : this.SpecularColour.ByteCount)) | 0) + (this.EmissionColour == null ? 4 : this.EmissionColour.ByteCount)) | 0) + 4) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(Bridge.ensureBaseProperty(this, "Bytes").$JTfy$BaseAttributeElement$Bytes);
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$6(this.DataFlags));
    
                        bytesList.AddRange(this.AmbientColour == null ? JTfy.StreamUtils.ToBytes$5(this.AmbientCommonRGBValue) : this.AmbientColour.Bytes);
    
                        bytesList.AddRange(this.DiffuseColour.Bytes);
    
                        bytesList.AddRange(this.SpecularColour == null ? JTfy.StreamUtils.ToBytes$5(this.SpecularCommonRGBValue) : this.SpecularColour.Bytes);
                        bytesList.AddRange(this.EmissionColour == null ? JTfy.StreamUtils.ToBytes$5(this.EmissionCommonRGBValue) : this.EmissionColour.Bytes);
    
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$5(this.Shininess));
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                init: function () {
                    this.shininess = 30;
                },
                ctor: function (diffuseColour, objectId) {
                    JTfy.MaterialAttributeElement.$ctor1.call(this, new JTfy.RGBA.$ctor1(diffuseColour), new JTfy.RGBA.$ctor1(diffuseColour), new JTfy.RGBA.$ctor1(diffuseColour), new JTfy.RGBA.ctor(), objectId);
                },
                $ctor1: function (ambientColour, diffuseColour, specularColour, emissionColour, objectId) {
                    this.$initialize();
                    JTfy.BaseAttributeElement.ctor.call(this, objectId);
                    this.DataFlags = 0;
    
                    this.DataFlags = (this.DataFlags | 16) & 65535;
                    this.DataFlags = (this.DataFlags | (384)) & 65535;
                    this.DataFlags = (this.DataFlags | (14336)) & 65535;
    
                    if (ambientColour == null) {
                        ambientColour = new JTfy.RGBA.ctor();
                    }
                    if (ambientColour.Red === ambientColour.Green && ambientColour.Red === ambientColour.Blue && ambientColour.Alpha === 1) {
                        this.DataFlags = (this.DataFlags | 1) & 65535;
                        this.DataFlags = (this.DataFlags | 2) & 65535;
    
                        this.AmbientCommonRGBValue = ambientColour.Red;
                    } else {
                        this.AmbientColour = ambientColour;
                    }
    
                    if (diffuseColour == null) {
                        diffuseColour = new JTfy.RGBA.ctor();
                    }
                    this.DiffuseColour = diffuseColour;
    
                    if (specularColour == null) {
                        specularColour = new JTfy.RGBA.ctor();
                    }
                    if (specularColour.Red === specularColour.Green && specularColour.Red === specularColour.Blue && specularColour.Alpha === 1) {
                        this.DataFlags = (this.DataFlags | 1) & 65535;
                        this.DataFlags = (this.DataFlags | 8) & 65535;
    
                        this.SpecularCommonRGBValue = specularColour.Red;
                    } else {
                        this.SpecularColour = specularColour;
                    }
    
                    if (emissionColour == null) {
                        emissionColour = new JTfy.RGBA.ctor();
                    }
                    if (emissionColour.Red === emissionColour.Green && emissionColour.Red === emissionColour.Blue && emissionColour.Alpha === 1) {
                        this.DataFlags = (this.DataFlags | 1) & 65535;
                        this.DataFlags = (this.DataFlags | 4) & 65535;
    
                        this.EmissionCommonRGBValue = emissionColour.Red;
                    } else {
                        this.EmissionColour = emissionColour;
                    }
    
                    this.Shininess = this.shininess;
                },
                $ctor2: function (stream) {
                    this.$initialize();
                    JTfy.BaseAttributeElement.$ctor1.call(this, stream);
                    this.DataFlags = JTfy.StreamUtils.ReadUInt16(stream);
    
                    var patternBitsAreUsed = (this.DataFlags & 1) > 0;
    
                    if (patternBitsAreUsed && (this.DataFlags & 2) > 0) {
                        this.AmbientCommonRGBValue = JTfy.StreamUtils.ReadFloat(stream);
                    } else {
                        this.AmbientColour = new JTfy.RGBA.$ctor2(stream);
                    }
    
                    this.DiffuseColour = new JTfy.RGBA.$ctor2(stream);
    
                    if (patternBitsAreUsed && (this.DataFlags & 8) > 0) {
                        this.SpecularCommonRGBValue = JTfy.StreamUtils.ReadFloat(stream);
                    } else {
                        this.SpecularColour = new JTfy.RGBA.$ctor2(stream);
                    }
    
                    if (patternBitsAreUsed && (this.DataFlags & 4) > 0) {
                        this.EmissionCommonRGBValue = JTfy.StreamUtils.ReadFloat(stream);
                    } else {
                        this.EmissionColour = new JTfy.RGBA.$ctor2(stream);
                    }
    
                    this.Shininess = JTfy.StreamUtils.ReadFloat(stream);
                }
            }
        });
    
        Bridge.define("JTfy.Vec$1", function (T) { return {
            inherits: [JTfy.DataArray$1(T)],
            props: {
                Count: {
                    get: function () {
                        return this.data.length;
                    }
                },
                ByteCount: {
                    get: function () {
                        return ((4 + Bridge.ensureBaseProperty(this, "ByteCount")["$JTfy$DataArray$1$" + Bridge.getTypeAlias(T)+"$ByteCount"]) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.Count));
    
                        for (var i = 0; i < this.Count; i = (i + 1) | 0) {
                            bytesList.AddRange(JTfy.StreamUtils.ToBytes$9(T, this.data[System.Array.index(i, this.data)]));
                        }
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.DataArray$1(T).ctor.call(this);
                    this.data = System.Array.init(JTfy.StreamUtils.ReadInt32(stream), function (){
                        return Bridge.getDefaultValue(T);
                    }, T);
    
                    for (var i = 0, c = this.data.length; i < c; i = (i + 1) | 0) {
                        this.data[System.Array.index(i, this.data)] = JTfy.StreamUtils.Read(T, stream);
                    }
                },
                ctor: function (data) {
                    this.$initialize();
                    JTfy.DataArray$1(T).ctor.call(this);
                    this.data = data;
                }
            }
        }; });
    
        Bridge.define("JTfy.RGB", {
            inherits: [JTfy.DataArray$1(System.Single)],
            props: {
                Red: {
                    get: function () {
                        return this.data[System.Array.index(0, this.data)];
                    }
                },
                Green: {
                    get: function () {
                        return this.data[System.Array.index(1, this.data)];
                    }
                },
                Blue: {
                    get: function () {
                        return this.data[System.Array.index(2, this.data)];
                    }
                }
            },
            ctors: {
                ctor: function (stream) {
                    this.$initialize();
                    JTfy.DataArray$1(System.Single).ctor.call(this);
                    this.data = System.Array.init([JTfy.StreamUtils.ReadFloat(stream), JTfy.StreamUtils.ReadFloat(stream), JTfy.StreamUtils.ReadFloat(stream)], System.Single);
                },
                $ctor1: function (red, green, blue) {
                    this.$initialize();
                    JTfy.DataArray$1(System.Single).ctor.call(this);
                    this.data = System.Array.init([red, green, blue], System.Single);
                }
            },
            methods: {
                toString: function () {
                    return System.String.format("R:{0}-G:{1}-B:{2}", Bridge.box(this.Red, System.Single, System.Single.format, System.Single.getHashCode), Bridge.box(this.Green, System.Single, System.Single.format, System.Single.getHashCode), Bridge.box(this.Blue, System.Single, System.Single.format, System.Single.getHashCode));
                }
            }
        });
    
        Bridge.define("JTfy.StringPropertyAtomElement", {
            inherits: [JTfy.BasePropertyAtomElement],
            fields: {
                Value: null
            },
            props: {
                ByteCount: {
                    get: function () {
                        return ((Bridge.ensureBaseProperty(this, "ByteCount").$JTfy$BasePropertyAtomElement$ByteCount + this.Value.ByteCount) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(Bridge.ensureBaseProperty(this, "Bytes").$JTfy$BasePropertyAtomElement$Bytes);
                        bytesList.AddRange(this.Value.Bytes);
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                $ctor2: function (value, objectId) {
                    JTfy.StringPropertyAtomElement.ctor.call(this, new JTfy.MbString.$ctor2(value), objectId);
                },
                ctor: function (value, objectId) {
                    this.$initialize();
                    JTfy.BasePropertyAtomElement.ctor.call(this, objectId);
                    this.Value = value;
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BasePropertyAtomElement.$ctor1.call(this, stream);
                    this.Value = new JTfy.MbString.$ctor1(stream);
                }
            },
            methods: {
                toString: function () {
                    return this.Value.toString();
                }
            }
        });
    
        Bridge.define("JTfy.TriStripSetShapeLODElement", {
            inherits: [JTfy.VertexShapeLODElement],
            fields: {
                versionNumber$1: 0,
                VertexBasedShapeCompressedRepData: null
            },
            props: {
                ByteCount: {
                    get: function () {
                        return ((((Bridge.ensureBaseProperty(this, "ByteCount").$JTfy$VertexShapeLODElement$ByteCount + 2) | 0) + this.VertexBasedShapeCompressedRepData.ByteCount) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(Bridge.ensureBaseProperty(this, "Bytes").$JTfy$VertexShapeLODElement$Bytes);
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$2(this.versionNumber$1));
                        bytesList.AddRange(this.VertexBasedShapeCompressedRepData.Bytes);
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                init: function () {
                    this.versionNumber$1 = 1;
                },
                $ctor1: function (triStrips, vertexPositions, vertexNormals) {
                    if (vertexNormals === void 0) { vertexNormals = null; }
    
                    JTfy.TriStripSetShapeLODElement.ctor.call(this, new JTfy.VertexBasedShapeCompressedRepData.ctor(triStrips, vertexPositions, vertexNormals));
                },
                ctor: function (vertexBasedShapeCompressedRepData) {
                    this.$initialize();
                    JTfy.VertexShapeLODElement.ctor.call(this, vertexBasedShapeCompressedRepData.NormalBinding, vertexBasedShapeCompressedRepData.QuantizationParameters);
                    this.VertexBasedShapeCompressedRepData = vertexBasedShapeCompressedRepData;
                },
                $ctor2: function (stream) {
                    this.$initialize();
                    JTfy.VertexShapeLODElement.$ctor1.call(this, stream);
                    this.versionNumber$1 = JTfy.StreamUtils.ReadInt16(stream);
                    this.VertexBasedShapeCompressedRepData = new JTfy.VertexBasedShapeCompressedRepData.$ctor1(stream);
                }
            }
        });
    
        Bridge.define("JTfy.CoordF32", {
            inherits: [JTfy.Coord$1(System.Single)],
            props: {
                X: {
                    get: function () {
                        return this.data[System.Array.index(0, this.data)];
                    }
                },
                Y: {
                    get: function () {
                        return this.data[System.Array.index(1, this.data)];
                    }
                },
                Z: {
                    get: function () {
                        return this.data[System.Array.index(2, this.data)];
                    }
                }
            },
            ctors: {
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.Coord$1(System.Single).$ctor1.call(this, stream);
                },
                $ctor2: function (x, y, z) {
                    this.$initialize();
                    JTfy.Coord$1(System.Single).ctor.call(this, x, y, z);
                },
                ctor: function () {
                    JTfy.CoordF32.$ctor2.call(this, 0, 0, 0);
                }
            }
        });
    
        Bridge.define("JTfy.LODNodeElement", {
            inherits: [JTfy.GroupNodeElement],
            fields: {
                reservedField1: null,
                reservedField2: 0
            },
            props: {
                ByteCount: {
                    get: function () {
                        return ((((Bridge.ensureBaseProperty(this, "ByteCount").$JTfy$GroupNodeElement$ByteCount + this.reservedField1.ByteCount) | 0) + 4) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(Bridge.ensureBaseProperty(this, "Bytes").$JTfy$GroupNodeElement$Bytes);
                        bytesList.AddRange(this.reservedField1.Bytes);
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.reservedField2));
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                init: function () {
                    this.reservedField1 = new JTfy.VecF32.ctor();
                    this.reservedField2 = 0;
                },
                ctor: function (objectId) {
                    this.$initialize();
                    JTfy.GroupNodeElement.ctor.call(this, objectId);
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.GroupNodeElement.$ctor1.call(this, stream);
                    this.reservedField1 = new JTfy.VecF32.$ctor1(stream);
                    this.reservedField2 = JTfy.StreamUtils.ReadInt32(stream);
                }
            }
        });
    
        Bridge.define("JTfy.MbString", {
            inherits: [JTfy.Vec$1(System.UInt16)],
            props: {
                Value: {
                    get: function () {
    
                        var chars = System.Linq.Enumerable.from(this.data, System.UInt16).select(function (uint16) {
                                return System.BitConverter.toChar(System.BitConverter.getBytes$7(uint16), 0);
                            }).ToArray(System.Char);
    
                        return System.String.fromCharArray(chars);
                    }
                }
            },
            ctors: {
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.Vec$1(System.UInt16).$ctor1.call(this, stream);
                },
                $ctor3: function (data) {
                    this.$initialize();
                    JTfy.Vec$1(System.UInt16).ctor.call(this, data);
                },
                ctor: function () {
                    this.$initialize();
                    JTfy.Vec$1(System.UInt16).ctor.call(this, System.Array.init(0, 0, System.UInt16));
                },
                $ctor2: function (value) {
                    this.$initialize();
                    JTfy.Vec$1(System.UInt16).ctor.call(this, System.Array.init(0, 0, System.UInt16));
                    var chars = System.String.toCharArray(value, 0, value.length);
    
    
    
                    this.data = System.Linq.Enumerable.from(chars, System.Char).select(function (c) {
                            return System.BitConverter.toUInt16(System.BitConverter.getBytes$1(c), 0);
                        }).ToArray(System.UInt16);
                }
            },
            methods: {
                toString: function () {
                    return this.Value;
                }
            }
        });
    
        Bridge.define("JTfy.MetaDataNodeElement", {
            inherits: [JTfy.GroupNodeElement],
            fields: {
                versionNumber: 0
            },
            props: {
                ByteCount: {
                    get: function () {
                        return ((Bridge.ensureBaseProperty(this, "ByteCount").$JTfy$GroupNodeElement$ByteCount + 2) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(Bridge.ensureBaseProperty(this, "Bytes").$JTfy$GroupNodeElement$Bytes);
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$2(this.versionNumber));
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                init: function () {
                    this.versionNumber = 1;
                },
                ctor: function (objectId) {
                    this.$initialize();
                    JTfy.GroupNodeElement.ctor.call(this, objectId);
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.GroupNodeElement.$ctor1.call(this, stream);
                    this.versionNumber = JTfy.StreamUtils.ReadInt16(stream);
                }
            }
        });
    
        Bridge.define("JTfy.PartitionNodeElement", {
            inherits: [JTfy.GroupNodeElement],
            fields: {
                PartitionFlags: 0,
                fileName: null,
                transformedBBox: null,
                Area: 0,
                vertexCountRange: null,
                nodeCountRange: null,
                polygonCountRange: null,
                untransformedBBox: null
            },
            props: {
                FileName: {
                    get: function () {
                        return this.fileName;
                    },
                    set: function (value) {
                        this.fileName = value;
                    }
                },
                TransformedBBox: {
                    get: function () {
                        return this.transformedBBox;
                    },
                    set: function (value) {
                        this.transformedBBox = value;
                    }
                },
                VertexCountRange: {
                    get: function () {
                        return this.vertexCountRange;
                    },
                    set: function (value) {
                        this.vertexCountRange = value;
                    }
                },
                NodeCountRange: {
                    get: function () {
                        return this.nodeCountRange;
                    },
                    set: function (value) {
                        this.nodeCountRange = value;
                    }
                },
                PolygonCountRange: {
                    get: function () {
                        return this.polygonCountRange;
                    },
                    set: function (value) {
                        this.polygonCountRange = value;
                    }
                },
                UntransformedBBox: {
                    get: function () {
                        return this.untransformedBBox;
                    },
                    set: function (value) {
                        this.untransformedBBox = value;
                        this.PartitionFlags = value == null ? 0 : 1;
                    }
                },
                ByteCount: {
                    get: function () {
                        return ((((((((((((Bridge.ensureBaseProperty(this, "ByteCount").$JTfy$GroupNodeElement$ByteCount + 4) | 0) + this.FileName.ByteCount) | 0) + (this.TransformedBBox == null ? 0 : this.TransformedBBox.ByteCount)) | 0) + 4) | 0) + Bridge.Int.mul(3, this.VertexCountRange.ByteCount)) | 0) + (this.UntransformedBBox == null ? 0 : this.UntransformedBBox.ByteCount)) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(Bridge.ensureBaseProperty(this, "Bytes").$JTfy$GroupNodeElement$Bytes);
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.PartitionFlags));
                        bytesList.AddRange(this.FileName.Bytes);
    
                        if (this.TransformedBBox != null) {
                            bytesList.AddRange(this.TransformedBBox.Bytes);
                        }
    
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$5(this.Area));
                        bytesList.AddRange(this.VertexCountRange.Bytes);
                        bytesList.AddRange(this.NodeCountRange.Bytes);
                        bytesList.AddRange(this.PolygonCountRange.Bytes);
    
                        if (this.UntransformedBBox != null) {
                            bytesList.AddRange(this.UntransformedBBox.Bytes);
                        }
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                init: function () {
                    this.fileName = new JTfy.MbString.ctor();
                    this.transformedBBox = new JTfy.BBoxF32.ctor();
                    this.vertexCountRange = new JTfy.CountRange.ctor();
                    this.nodeCountRange = new JTfy.CountRange.ctor();
                    this.polygonCountRange = new JTfy.CountRange.ctor();
                },
                $ctor1: function (objectId, element) {
                    JTfy.PartitionNodeElement.ctor.call(this, objectId);
                    this.PartitionFlags = element.PartitionFlags;
                    this.FileName = element.FileName;
                    this.TransformedBBox = element.TransformedBBox;
                    this.Area = element.Area;
                    this.VertexCountRange = element.VertexCountRange;
                    this.NodeCountRange = element.NodeCountRange;
                    this.PolygonCountRange = element.PolygonCountRange;
                    this.UntransformedBBox = element.UntransformedBBox;
                },
                ctor: function (objectId) {
                    this.$initialize();
                    JTfy.GroupNodeElement.ctor.call(this, objectId);
                },
                $ctor2: function (stream) {
                    this.$initialize();
                    JTfy.GroupNodeElement.$ctor1.call(this, stream);
                    this.PartitionFlags = JTfy.StreamUtils.ReadInt32(stream);
                    this.FileName = new JTfy.MbString.$ctor1(stream);
                    this.TransformedBBox = new JTfy.BBoxF32.$ctor2(stream);
                    this.Area = JTfy.StreamUtils.ReadFloat(stream);
                    this.VertexCountRange = new JTfy.CountRange.$ctor3(stream);
                    this.NodeCountRange = new JTfy.CountRange.$ctor3(stream);
                    this.PolygonCountRange = new JTfy.CountRange.$ctor3(stream);
    
                    if ((this.PartitionFlags & 1) !== 0) {
                        this.UntransformedBBox = new JTfy.BBoxF32.$ctor2(stream);
                    }
                }
            }
        });
    
        Bridge.define("JTfy.RGBA", {
            inherits: [JTfy.RGB],
            statics: {
                methods: {
                    Convert: function (colourComponentValue) {
                        return colourComponentValue / 255.0;
                    }
                }
            },
            props: {
                Alpha: {
                    get: function () {
                        return this.data[System.Array.index(3, this.data)];
                    }
                }
            },
            ctors: {
                $ctor2: function (stream) {
                    this.$initialize();
                    JTfy.RGB.ctor.call(this, stream);
                    this.data = System.Array.init([this.Red, this.Green, this.Blue, JTfy.StreamUtils.ReadFloat(stream)], System.Single);
                },
                $ctor3: function (red, green, blue, alpha) {
                    this.$initialize();
                    JTfy.RGB.$ctor1.call(this, red, green, blue);
                    this.data = System.Array.init([this.Red, this.Green, this.Blue, alpha], System.Single);
                },
                ctor: function () {
                    JTfy.RGBA.$ctor3.call(this, 0, 0, 0, 1);
                },
                $ctor1: function (colour) {
                    JTfy.RGBA.$ctor3.call(this, JTfy.RGBA.Convert(colour.R), JTfy.RGBA.Convert(colour.G), JTfy.RGBA.Convert(colour.B), JTfy.RGBA.Convert(colour.A));
                }
            },
            methods: {
                toString: function () {
                    return System.String.format("A:{0}-{1}", Bridge.box(this.Alpha, System.Single, System.Single.format, System.Single.getHashCode), JTfy.RGB.prototype.toString.call(this));
                }
            }
        });
    
        Bridge.define("JTfy.VertexShapeNodeElement", {
            inherits: [JTfy.BaseShapeNodeElement],
            fields: {
                NormalBinding: 0,
                TextureBinding: 0,
                ColourBinding: 0,
                QuantizationParameters: null
            },
            props: {
                ByteCount: {
                    get: function () {
                        return ((((((((Bridge.ensureBaseProperty(this, "ByteCount").$JTfy$BaseShapeNodeElement$ByteCount + 4) | 0) + 4) | 0) + 4) | 0) + this.QuantizationParameters.ByteCount) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(Bridge.ensureBaseProperty(this, "Bytes").$JTfy$BaseShapeNodeElement$Bytes);
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.NormalBinding));
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.TextureBinding));
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.ColourBinding));
                        bytesList.AddRange(this.QuantizationParameters.Bytes);
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.BaseShapeNodeElement.$ctor2.call(this, stream);
                    this.NormalBinding = JTfy.StreamUtils.ReadInt32(stream);
                    this.TextureBinding = JTfy.StreamUtils.ReadInt32(stream);
                    this.ColourBinding = JTfy.StreamUtils.ReadInt32(stream);
                    this.QuantizationParameters = new JTfy.QuantizationParameters.$ctor1(stream);
                },
                ctor: function (geometricSet, objectId) {
                    this.$initialize();
                    JTfy.BaseShapeNodeElement.$ctor1.call(this, geometricSet, objectId);
                    this.NormalBinding = geometricSet.Normals == null ? 1 : 0;
                    this.TextureBinding = 0;
                    this.ColourBinding = 0;
                    this.QuantizationParameters = new JTfy.QuantizationParameters.ctor(0, 0, 0, 0);
                }
            }
        });
    
        Bridge.define("JTfy.VecF32", {
            inherits: [JTfy.Vec$1(System.Single)],
            ctors: {
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.Vec$1(System.Single).$ctor1.call(this, stream);
                },
                $ctor2: function (data) {
                    this.$initialize();
                    JTfy.Vec$1(System.Single).ctor.call(this, data);
                },
                ctor: function () {
                    JTfy.VecF32.$ctor2.call(this, System.Array.init(0, 0, System.Single));
                }
            }
        });
    
        Bridge.define("JTfy.VecI32", {
            inherits: [JTfy.Vec$1(System.Int32)],
            ctors: {
                $ctor2: function (stream) {
                    this.$initialize();
                    JTfy.Vec$1(System.Int32).$ctor1.call(this, stream);
                },
                $ctor1: function (data) {
                    this.$initialize();
                    JTfy.Vec$1(System.Int32).ctor.call(this, data);
                },
                ctor: function () {
                    JTfy.VecI32.$ctor1.call(this, System.Array.init(0, 0, System.Int32));
                }
            }
        });
    
        Bridge.define("JTfy.VecU32", {
            inherits: [JTfy.Vec$1(System.UInt32)],
            ctors: {
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.Vec$1(System.UInt32).$ctor1.call(this, stream);
                },
                $ctor2: function (data) {
                    this.$initialize();
                    JTfy.Vec$1(System.UInt32).ctor.call(this, data);
                },
                ctor: function () {
                    JTfy.VecU32.$ctor2.call(this, System.Array.init(0, 0, System.UInt32));
                }
            }
        });
    
        Bridge.define("JTfy.PartNodeElement", {
            inherits: [JTfy.MetaDataNodeElement],
            fields: {
                versionNumber$1: 0,
                reservedField: 0
            },
            props: {
                ByteCount: {
                    get: function () {
                        return ((((Bridge.ensureBaseProperty(this, "ByteCount").$JTfy$MetaDataNodeElement$ByteCount + 2) | 0) + 4) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(Bridge.ensureBaseProperty(this, "Bytes").$JTfy$MetaDataNodeElement$Bytes);
    
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$2(this.versionNumber$1));
                        bytesList.AddRange(JTfy.StreamUtils.ToBytes$3(this.reservedField));
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                init: function () {
                    this.versionNumber$1 = 1;
                    this.reservedField = 0;
                },
                ctor: function (objectId) {
                    this.$initialize();
                    JTfy.MetaDataNodeElement.ctor.call(this, objectId);
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.MetaDataNodeElement.$ctor1.call(this, stream);
                    this.versionNumber$1 = JTfy.StreamUtils.ReadInt16(stream);
                    this.reservedField = JTfy.StreamUtils.ReadInt32(stream);
                }
            }
        });
    
        Bridge.define("JTfy.RangeLODNodeElement", {
            inherits: [JTfy.LODNodeElement],
            fields: {
                rangeLimits: null,
                center: null
            },
            props: {
                RangeLimits: {
                    get: function () {
                        return this.rangeLimits;
                    },
                    set: function (value) {
                        this.rangeLimits = value || new JTfy.VecF32.ctor();
                    }
                },
                Center: {
                    get: function () {
                        return this.center;
                    },
                    set: function (value) {
                        this.center = value || new JTfy.CoordF32.ctor();
                    }
                },
                ByteCount: {
                    get: function () {
                        return ((((Bridge.ensureBaseProperty(this, "ByteCount").$JTfy$LODNodeElement$ByteCount + this.RangeLimits.ByteCount) | 0) + this.Center.ByteCount) | 0);
                    }
                },
                Bytes: {
                    get: function () {
                        var bytesList = new (System.Collections.Generic.List$1(System.Byte)).$ctor2(this.ByteCount);
    
                        bytesList.AddRange(Bridge.ensureBaseProperty(this, "Bytes").$JTfy$LODNodeElement$Bytes);
                        bytesList.AddRange(this.RangeLimits.Bytes);
                        bytesList.AddRange(this.Center.Bytes);
    
                        return bytesList.ToArray();
                    }
                }
            },
            ctors: {
                init: function () {
                    this.rangeLimits = new JTfy.VecF32.ctor();
                    this.center = new JTfy.CoordF32.ctor();
                },
                ctor: function (objectId) {
                    this.$initialize();
                    JTfy.LODNodeElement.ctor.call(this, objectId);
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.LODNodeElement.$ctor1.call(this, stream);
                    this.RangeLimits = new JTfy.VecF32.$ctor1(stream);
                    this.Center = new JTfy.CoordF32.$ctor1(stream);
                }
            }
        });
    
        Bridge.define("JTfy.TriStripSetShapeNodeElement", {
            inherits: [JTfy.VertexShapeNodeElement],
            props: {
                ByteCount: {
                    get: function () {
                        return Bridge.ensureBaseProperty(this, "ByteCount").$JTfy$VertexShapeNodeElement$ByteCount;
                    }
                },
                Bytes: {
                    get: function () {
                        return Bridge.ensureBaseProperty(this, "Bytes").$JTfy$VertexShapeNodeElement$Bytes;
                    }
                }
            },
            ctors: {
                ctor: function (geometrySet, objectId) {
                    this.$initialize();
                    JTfy.VertexShapeNodeElement.ctor.call(this, geometrySet, objectId);
                },
                $ctor1: function (stream) {
                    this.$initialize();
                    JTfy.VertexShapeNodeElement.$ctor1.call(this, stream);
                }
            }
        });
        Bridge.init();
    });
});
