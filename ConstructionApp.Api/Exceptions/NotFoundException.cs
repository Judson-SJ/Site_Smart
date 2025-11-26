using System;

namespace ConstructionApp.Api.Exceptions;

public class NotFoundException : Exception
    {
        public NotFoundException(string message) : base(message) { }
    }
